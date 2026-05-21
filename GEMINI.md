---
applyTo: '**'
---

# Projekt-Instruktionen: FluxFinance

Dieses Dokument dient als zentrale Wissensbasis für KI-Agenten in diesem Projekt. Es definiert die Standards, Architektur-Entscheidungen und Workflows.

## General
- In all interactions be extremly concise and sacrifice grammar for the sake of concision
- Git commits are not executed by the the ai / agent

## Plans
- At the end of each plan, give me a list of unresolved questions to answerm if any. Make the questions extremly concise for the sake of concision
- Always create a PLAN.md file and update it after each steps if necessary. The PLAN.md file should be a concise summary of the plan and the steps taken to execute it. Each plan iterations (step) is written or updated in the ITERATIONS_LOG.md file after it was executed. Sacrifice grammar for the sake of concision

## Development

### Comments
- All comments are written in english
- camelCase for variables, PascalCase for classes
- Follow configuration if exist strictly 

### Testing
- Each new feature needs tests

### Frontend: Angular
- Use latest Angular version
- Use pnpm as package manager and create a workspace
- Follow the angular workspace approach with multiple libs and apps
- Use standalone components and no modules at all
- Use Angular Material components (also CDK), use Angular Material Themes with the possibility to create custom themes
- Use zoneless
- Use scss
- Do not use inline html templates, provide it in a separate file
- Do not use inline css, scss templates, provide it in a separate file
- Split components in small testable pieces
- Use typescript in strict mode
- Follow explicit error handling, no empty catch
- Prefere a11y ready html elements
- Always use the `takeUntilDestroy` operator when handling Observables and always use `ReplaySubject` instead of simple `Subject`
- Always use reactive-forms
- Always use variables instead of strings in html templates, variables are declared as private class members in the related component
- Always use deep-linking approach when navigating, especially query parameters for API calls should be reflected in the URL (route)  
- Always generate UI components with responsiveness to have an optimized view on mobile devices (iPhone 15 an newer, iPad 10" / 11" / 12" / 13")
- Use angular signals for UI states but NOT for business data
- Use rxjs for business data but NOT for UI states
- Do not subscribe on Observables in ngOnInit
- Always store user related session information like search, filter and sorting parameters or auth information in local or session storage 

### Frontend: UI/UX
- Always create a file `UI.md` under `docs/` which contains a description of the UI / UX concept we approach and update it if UI changes happened. Sacrifice grammar for the sake of concision.  

### Database / Data handling
- The `data/` folder contains all system data which is saved (read/write) in ndjson files 
- If it comes to problems with this approach, e.g. simultaneous write access to the files, let me know and ask me what to do

## Documentation
- Technical details are under `docs/`
- `ARCHITECTURE.md` (under `docs/`) contains all relevant architectural decisions, each decision is also written into a `ADR.md`. Each decision will be recorded with a timestamp of creation.  
- `README.md` (root) is an entry point for the user. Always write down all relevant information reagrding development, configuration,  excution or setting the system into the file. Be extremly concise.
