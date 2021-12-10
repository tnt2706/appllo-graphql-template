module.exports = {
  CONSTANCE: {
    SOCKETIO_EVENT: {
      NEW_CARE_PLAN: 'NewCarePlan',
      CARE_PLAN_UPDATED: 'CarePlanUpdated',
      CARE_PLAN_ASSIGNEE_CHANGED: 'CarePlanAssigneeChanged',
      REPORT: {
        SENT_REPORT: 'SentReport',
      },
      NOTIFICATION: 'Notification',
      NOTIFICATION_TYPE: {
        ADD: 'Add',
        MARK_ALL_AS_READ: 'MarkAllAsRead',
        MARK_AS_READ: 'MarkAsRead',
        DELETE: 'Delete',
        DELETE_ALL: 'DeleteAll',
      },
    },
    NOTIFICATION: {
      REPORT: 'Report',
      SENT_REPORT: 'SentReport',
      UPDATED_CAREPLAN: 'UpdatedCarePlan',
      STARTED_CAREPLAN: 'StartedCarePlan',
      PATIENT_COMPLETE_PROFILE: 'PatientCompleteProfile',
      NURSE_REGISTER_QUALITY_OF_LIFE_TEST: 'QualityOfLifeTest',
      OTHER: 'Other',
    },
    NOTIFICATION_TITLE: {
      STARTED_CAREPLAN: 'Started Care Plan',
      UPDATED_CAREPLAN: 'Updated Care Plan',
      PATIENT_COMPLETE_PROFILE: 'Patient registration complete',
      NURSE_REGISTER_QUALITY_OF_LIFE_TEST: 'Quality of life test',
      REPORT: 'Report',
    },
    CAREPLAN: { STATUS: {
      NEW: 'New',
      ACTIVE: 'Active',
      INACTIVE: 'Inactive',
    } },
    USER: { STATUS: {
      PATIENT: 'Patient',
      NURSE: 'Nurse',
      PHYSICIAN: 'Physician',
    },
    ROLES: {
      ADMIN: 'Admin',
      FACILITY_ADMIN: 'Facility Admin',
      CLINIC_PHYSICIAN: 'Clinic Physician',
      CLINIC_TECHNICIAN: 'Clinic Technician',
      PATIENT: 'Patient',
      REPORT_PRINTER: 'ReportPrinter',
    } },
    REPORT: {
      TYPE: {
        MONTHLY: 'Monthly',
        NOTIFICATION: 'Notification',
      },
      STATUS: {
        REVIEWED: 'Reviewed',
        SENT: 'Sent',
      },
    },
    MEDICAL_TEST_RESULT: {
      STRESS: 'Stress',
      CBC: 'CBC',
      LIVER: 'Liver',
      LEAD_ECG: 'LeadECG',
      BASELINE: 'Baseline',
      BLOOD_SUGAR: 'BloodSugar',
      LIPID: 'Lipid',
      INR: 'INR',
      OTHER: 'Other',
      LVEF: 'LVEF',
    },
    DAILY_INFO: {
      TRIGGER_TYPE: {
        HEARTRATE: 'HeartRate',
        EHRA: 'EHRA',
        BLOODPRESSURE: 'BloodPressure',
        SYMPTOMS: 'Symptoms',
        SLEEPDISTURBANCE: 'SleepDisturbance',
        MEDICATIONNONADHERENCE: 'MedicationNonadherence',
      },
      SYMPTOMS: {
        CHESTPAIN: 'ChestPain',
        PALPITATIONS: 'Palpitations',
        LIGHTHEAD: 'LightHead',
        SHORTOFBREATH: 'ShortOfBreath',
        ABNORMALBLEEDING: 'AbnormalBleeding',
      },
    },
  },
};
