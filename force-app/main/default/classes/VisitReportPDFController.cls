/**
 * Visit Report PDF Controller
 * Controller for Visualforce PDF generation
 *
 * @author GBase SF Integration
 * @date 2025
 */
public with sharing class VisitReportPDFController {

    public Visit_Report__c report { get; set; }
    public String formattedDate { get; set; }
    public String formattedAmount { get; set; }
    public List<String> discussionPoints { get; set; }
    public List<String> actionItems { get; set; }

    public VisitReportPDFController() {
        String recordId = ApexPages.currentPage().getParameters().get('id');

        if (String.isNotBlank(recordId)) {
            loadReport(recordId);
        }
    }

    private void loadReport(String recordId) {
        try {
            report = [
                SELECT Id, Name, Visit_Date__c, Company_Name__c, Contact_Name__c,
                       Contact_Title__c, Visit_Purpose__c, Discussion_Summary__c,
                       Next_Actions__c, Opportunity_Amount__c, Expected_Close_Date__c,
                       Account__c, Account__r.Name, Contact__c, Contact__r.Name,
                       CreatedDate, CreatedBy.Name, LastModifiedDate
                FROM Visit_Report__c
                WHERE Id = :recordId
                LIMIT 1
            ];

            // Format date
            if (report.Visit_Date__c != null) {
                formattedDate = report.Visit_Date__c.format();
            } else {
                formattedDate = 'N/A';
            }

            // Format amount
            if (report.Opportunity_Amount__c != null) {
                formattedAmount = '¥' + report.Opportunity_Amount__c.format();
            } else {
                formattedAmount = 'N/A';
            }

            // Parse discussion points
            discussionPoints = new List<String>();
            if (String.isNotBlank(report.Discussion_Summary__c)) {
                for (String line : report.Discussion_Summary__c.split('\n')) {
                    String cleanLine = line.replaceFirst('^[•\\-\\*]\\s*', '').trim();
                    if (String.isNotBlank(cleanLine)) {
                        discussionPoints.add(cleanLine);
                    }
                }
            }

            // Parse action items
            actionItems = new List<String>();
            if (String.isNotBlank(report.Next_Actions__c)) {
                for (String line : report.Next_Actions__c.split('\n')) {
                    String cleanLine = line.replaceFirst('^[•\\-\\*]\\s*', '').trim();
                    if (String.isNotBlank(cleanLine)) {
                        actionItems.add(cleanLine);
                    }
                }
            }

        } catch (Exception e) {
            ApexPages.addMessage(new ApexPages.Message(
                ApexPages.Severity.ERROR,
                'Error loading report: ' + e.getMessage()
            ));
        }
    }
}