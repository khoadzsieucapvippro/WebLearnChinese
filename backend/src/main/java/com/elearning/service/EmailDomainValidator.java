package com.elearning.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.naming.CommunicationException;
import javax.naming.NameNotFoundException;
import javax.naming.NamingEnumeration;
import javax.naming.NamingException;
import javax.naming.directory.Attribute;
import javax.naming.directory.Attributes;
import javax.naming.directory.DirContext;
import javax.naming.directory.InitialDirContext;
import java.net.IDN;
import java.util.Hashtable;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.regex.Pattern;

/**
 * Validates email syntax and optionally checks DNS MX records to ensure
 * the target domain actually exists and is configured to receive emails.
 */
@Component
public class EmailDomainValidator {

    private static final Logger log = LoggerFactory.getLogger(EmailDomainValidator.class);
    private static final Pattern EMAIL_PATTERN = Pattern.compile(
            "^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,63}$"
    );
    private static final long CACHE_TTL_MS = 15 * 60 * 1000L;
    private static final int MAX_CACHE_SIZE = 1000;

    private final Map<String, CachedMxResult> domainCache = new ConcurrentHashMap<>();

    @Value("${app.email.verify-mx-record:true}")
    private boolean verifyMxRecord = true;

    private record CachedMxResult(boolean valid, long expiresAt) {
        boolean isExpired() {
            return System.currentTimeMillis() > expiresAt;
        }
    }

    public boolean isValidEmailSyntax(String email) {
        if (email == null) {
            return false;
        }
        String trimmed = email.trim();
        return !trimmed.isEmpty() && trimmed.length() <= 191 && EMAIL_PATTERN.matcher(trimmed).matches();
    }

    /**
     * Checks syntax and, when enabled, verifies the domain has at least one non-null DNS MX record.
     */
    public boolean isDeliverableEmailDomain(String email) {
        if (!isValidEmailSyntax(email)) {
            return false;
        }
        if (!verifyMxRecord) {
            return true;
        }

        String trimmed = email.trim().toLowerCase(Locale.ROOT);
        int atIdx = trimmed.lastIndexOf('@');
        if (atIdx < 0 || atIdx >= trimmed.length() - 1) {
            return false;
        }

        String asciiDomain;
        try {
            asciiDomain = IDN.toASCII(trimmed.substring(atIdx + 1));
        } catch (IllegalArgumentException e) {
            return false;
        }

        CachedMxResult cached = domainCache.get(asciiDomain);
        if (cached != null && !cached.isExpired()) {
            return cached.valid();
        }

        boolean hasMx = lookupMxRecord(asciiDomain);
        if (domainCache.size() >= MAX_CACHE_SIZE) {
            domainCache.entrySet().removeIf(entry -> entry.getValue().isExpired());
        }
        domainCache.put(asciiDomain, new CachedMxResult(hasMx, System.currentTimeMillis() + CACHE_TTL_MS));
        return hasMx;
    }

    protected boolean lookupMxRecord(String asciiDomain) {
        Hashtable<String, String> env = new Hashtable<>();
        env.put("java.naming.factory.initial", "com.sun.jndi.dns.DnsContextFactory");
        env.put("com.sun.jndi.dns.timeout.initial", "2500");
        env.put("com.sun.jndi.dns.timeout.retries", "1");

        DirContext ctx = null;
        try {
            ctx = new InitialDirContext(env);
            Attributes attrs = ctx.getAttributes(asciiDomain, new String[]{"MX"});
            Attribute mxAttr = attrs.get("MX");
            if (mxAttr == null || mxAttr.size() == 0) {
                return false;
            }
            NamingEnumeration<?> all = mxAttr.getAll();
            while (all.hasMore()) {
                String value = String.valueOf(all.next()).trim();
                // RFC 7505 null MX ("0 .") explicitly indicates domain does not accept email
                if (!value.isEmpty() && !value.equals("0 .") && !value.endsWith(" .")) {
                    return true;
                }
            }
            return false;
        } catch (NameNotFoundException e) {
            return false;
        } catch (CommunicationException e) {
            log.warn("Không thể truy vấn DNS MX cho domain {} do lỗi mạng tạm thời; cho phép tiếp tục qua OTP.", asciiDomain);
            return true;
        } catch (NamingException e) {
            log.debug("Lỗi tra cứu DNS MX cho domain {}: {}", asciiDomain, e.getMessage());
            return false;
        } finally {
            if (ctx != null) {
                try {
                    ctx.close();
                } catch (NamingException ignored) {
                }
            }
        }
    }
}
