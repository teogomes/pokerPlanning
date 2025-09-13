import React from "react";
import Box from "@mui/material/Box";

interface JiraTicketWebviewProps {
  url: string; // The full URL to the Jira ticket
}

const JiraTicketWebview: React.FC<JiraTicketWebviewProps> = ({ url }) => {
  return (
    <Box
      sx={{
        width: "100%",
        height: "100%",
        minHeight: 400,
        borderRadius: 2,
        overflow: "hidden",
        boxShadow: 2,
      }}
    >
      <iframe
        src={url}
        title="Jira Ticket"
        style={{ width: "100%", height: "100%", border: "none" }}
        sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
      />
    </Box>
  );
};

export default JiraTicketWebview;
