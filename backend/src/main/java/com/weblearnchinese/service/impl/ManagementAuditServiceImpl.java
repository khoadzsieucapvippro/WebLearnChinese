package com.weblearnchinese.service.impl;

import com.elearning.repository.AccountRepository;
import com.elearning.repository.ManagementAuditLogRepository;
import com.elearning.service.AuditDataSanitizer;

/**
 * ManagementAuditServiceImpl alias for com.elearning.service.impl.ManagementAuditServiceImpl.
 */
public class ManagementAuditServiceImpl extends com.elearning.service.impl.ManagementAuditServiceImpl
        implements com.weblearnchinese.service.ManagementAuditService {

    public ManagementAuditServiceImpl(ManagementAuditLogRepository managementAuditLogRepository,
                                     AccountRepository accountRepository,
                                     AuditDataSanitizer auditDataSanitizer) {
        super(managementAuditLogRepository, accountRepository, auditDataSanitizer);
    }
}
