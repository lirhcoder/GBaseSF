/**
 * GBaseMeetingController - Apex controller for GBase Meeting LWC components
 * Provides data access methods for meeting list and details
 *
 * @author GBase Team
 * @version 1.0
 */
public with sharing class GBaseMeetingController {

    /**
     * Get list of meetings for the current user
     * @return List of GBase_Meeting__c records
     */
    @AuraEnabled(cacheable=true)
    public static List<GBase_Meeting__c> getMeetings() {
        return [
            SELECT Id,
                   Meeting_Title__c,
                   Meeting_Date__c,
                   Duration_Minutes__c,
                   Status__c,
                   Account__c,
                   Account__r.Name,
                   Opportunity__c,
                   Opportunity__r.Name,
                   GBase_Job_Id__c,
                   CreatedDate
            FROM GBase_Meeting__c
            ORDER BY Meeting_Date__c DESC NULLS LAST, CreatedDate DESC
            LIMIT 100
        ];
    }

    /**
     * Get meeting details by ID
     * @param meetingId - The meeting record ID
     * @return GBase_Meeting__c record with all fields
     */
    @AuraEnabled(cacheable=true)
    public static GBase_Meeting__c getMeetingById(String meetingId) {
        List<GBase_Meeting__c> meetings = [
            SELECT Id,
                   Meeting_Title__c,
                   Meeting_Date__c,
                   Duration_Minutes__c,
                   Status__c,
                   Audio_URL__c,
                   Transcript__c,
                   Analysis_Result__c,
                   Summary__c,
                   Account__c,
                   Account__r.Name,
                   Opportunity__c,
                   Opportunity__r.Name,
                   GBase_Job_Id__c,
                   CreatedDate,
                   LastModifiedDate
            FROM GBase_Meeting__c
            WHERE Id = :meetingId
            LIMIT 1
        ];

        if (meetings.isEmpty()) {
            throw new AuraHandledException('Meeting not found');
        }

        return meetings[0];
    }

    /**
     * Get documents for a meeting
     * @param meetingId - The meeting record ID
     * @return List of GBase_Document__c records
     */
    @AuraEnabled(cacheable=true)
    public static List<GBase_Document__c> getDocuments(String meetingId) {
        return [
            SELECT Id,
                   Document_Type__c,
                   File_Name__c,
                   Document_URL__c,
                   Generation_Status__c,
                   CreatedDate
            FROM GBase_Document__c
            WHERE Meeting__c = :meetingId
            ORDER BY CreatedDate DESC
        ];
    }

    /**
     * Search meetings by title or account
     * @param searchTerm - Search term
     * @return List of matching GBase_Meeting__c records
     */
    @AuraEnabled(cacheable=true)
    public static List<GBase_Meeting__c> searchMeetings(String searchTerm) {
        String searchPattern = '%' + String.escapeSingleQuotes(searchTerm) + '%';
        return [
            SELECT Id,
                   Meeting_Title__c,
                   Meeting_Date__c,
                   Duration_Minutes__c,
                   Status__c,
                   Account__c,
                   Account__r.Name
            FROM GBase_Meeting__c
            WHERE Meeting_Title__c LIKE :searchPattern
               OR Account__r.Name LIKE :searchPattern
            ORDER BY Meeting_Date__c DESC
            LIMIT 50
        ];
    }

    /**
     * Get meetings by status
     * @param status - Status value
     * @return List of GBase_Meeting__c records with the specified status
     */
    @AuraEnabled(cacheable=true)
    public static List<GBase_Meeting__c> getMeetingsByStatus(String status) {
        return [
            SELECT Id,
                   Meeting_Title__c,
                   Meeting_Date__c,
                   Duration_Minutes__c,
                   Status__c,
                   Account__c,
                   Account__r.Name
            FROM GBase_Meeting__c
            WHERE Status__c = :status
            ORDER BY Meeting_Date__c DESC
            LIMIT 100
        ];
    }

    /**
     * Get meeting statistics
     * @return Map with statistics (total, completed, pending, failed)
     */
    @AuraEnabled(cacheable=true)
    public static Map<String, Integer> getMeetingStats() {
        Map<String, Integer> stats = new Map<String, Integer>();

        AggregateResult[] results = [
            SELECT Status__c, COUNT(Id) cnt
            FROM GBase_Meeting__c
            GROUP BY Status__c
        ];

        Integer total = 0;
        for (AggregateResult ar : results) {
            String status = (String) ar.get('Status__c');
            Integer count = (Integer) ar.get('cnt');
            stats.put(status, count);
            total += count;
        }
        stats.put('Total', total);

        return stats;
    }
}