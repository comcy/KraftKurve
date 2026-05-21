---
applyTo: '**'
---

# Project general coding standards
 
- In all interactions and commit messages, be extremely concise and sacrifice grammar for the sake of concision.
 
## Plans
 
- At the end of each plan, give me a list of unresolved questions to answer, if any. Make the questions extremely concise. Sacrifice grammar for the sake of concision.
- Always create a plan.md file and update it after every step if necessary. The plan.md file should be a concise summary of the plan and the steps taken to execute it. Sacrifice grammar for the sake of concision.
 
## Azure Devops
 
- Your primary method for interacting with Azure Devops should be the az cli.
 
 
## Plan Mode
 
- Make the plan extremely concise. Sacrifice grammar for the sake of concision.
- At the end of each plan, give me a list of unresolved questions to answer, if any.az login$token = az account get-access-token --resource 499b84ac-1321-427f-aa17-267ca6975798 --query accessToken -o tsv
dotnet nuget update source "IQS-CQ-Feed" --username "az" --password $token --store-password-in-clear-text
dotnet restore src/gic-api/WebInspect.API.sln