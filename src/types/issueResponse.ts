interface JiraIssueResponse {
  expand: string;
  id: string;
  self: string;
  key: string;
  fields: {
    summary: string;
    description: string;
    issuetype: {
      id: string;
      description: string;
      iconUrl: string;
      name: string;
      subtask: boolean;
    };
    priority: {
      id: string;
      name: string;
      iconUrl: string;
    };
    status: {
      id: string;
      description: string;
      name: string;
      iconUrl: string;
    };
  };
}

interface JiraIssueResponseFocussed {
  id: JiraIssueResponse["key"];
  summary: JiraIssueResponse["fields"]["summary"];
  description: JiraIssueResponse["fields"]["description"];
  issueType: JiraIssueResponse["fields"]["issuetype"]["name"];
}
