package com.weblearnchinese.controller;

import com.elearning.service.ManagementAuditService;

/**
 * AdminAuditLogController alias for com.elearning.controller.AdminAuditLogController.
 */
public class AdminAuditLogController extends com.elearning.controller.AdminAuditLogController {

    public AdminAuditLogController(ManagementAuditService managementAuditService) {
        super(managementAuditService);
    }
}
