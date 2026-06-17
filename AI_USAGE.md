# AI Usage Report

## AI Tools Used

* **Claude (Claude Code)** — Used for initial code generation, React component implementation, state management structure, feature implementation, debugging, and code improvement.

## Tasks Supported by AI

* Converted the initial TeamFlow requirement prompt into a working frontend web application.
* Generated the initial React + TypeScript + Vite project structure.
* Created a clean, modern, card-based responsive UI using Tailwind CSS.
* Implemented localStorage-based data persistence so that user data remains after page refresh.
* Designed the main data models in `types.ts`.
* Designed and implemented the Zustand store structure for managing project state.
* Implemented team member management, including adding, displaying, and deleting members.
* Implemented automatic role assignment using predefined roles: presentation, PPT creation, research, report writing, and schedule management.
* Implemented meeting availability input and meeting time recommendation logic.
* Implemented to-do management, including task creation, assignee selection, due date input, completion check, deletion, and deadline highlighting.
* Implemented a progress dashboard that calculates total progress and member-level task status.
* Implemented project deadline input and D-Day calculation.
* Implemented a data reset feature with a confirmation dialog.
* Designed and implemented a storage abstraction layer.
* The initial requirement was to avoid external APIs and backend servers and to store data only in localStorage. The project still supports this localStorage-only mode by default.
* Later, the storage structure was extended so that Firebase can be used optionally when environment variables are provided.
* Implemented the `ProjectBackend` interface to separate localStorage and Firebase implementations.
* Implemented a lightweight name + PIN login flow.
* Implemented a multi-project home screen so that one user can manage multiple team projects.
* Implemented project cards showing project progress and basic project information.
* Implemented a team chat feature using a project-level message structure.
* Debugged TypeScript project reference issues.
* Debugged `import.meta.env` type errors in the Vite environment.
* Debugged a Temporal Dead Zone issue caused by synchronous local backend subscription behavior.
* Improved edge cases in sample project creation, member ID mapping, meeting time drag behavior, and meeting time recommendation sorting.

## Example Prompts

1. "You are an experienced frontend developer. Create a website for managing college team projects. The project name is TeamFlow. The goal is to help college students manage team members, assign roles, coordinate meeting schedules, manage tasks, and check project progress in one place. Do not use external APIs. Do not use a backend server. Store data in localStorage. Make sure entered data remains after refreshing the page. Make it look like a college assignment project, but not too simple. Use a clean and modern web app design. Make it responsive for both mobile and desktop. Use React, Vite, and CSS or Tailwind CSS. Split components when necessary. Main features: member management, automatic role assignment, meeting time coordination, to-do management, progress dashboard, D-Day display, and data reset. The page should include a header with the TeamFlow logo and a short description, a dashboard area, member management area, role assignment area, meeting time recommendation area, and to-do management area. Use a white and light gray based UI, card layout, styled buttons, inputs, and progress bars. Add section titles and short descriptions. Include meaningful variable names, comments for important logic, localStorage save/load logic, and project execution instructions such as npm install and npm run dev."

2. "Read the TeamFlow technical specification below and implement it step by step in the correct order. After each step, make sure the project is in a working state."

3. "I do not know Firebase well. Make the project work with localStorage first, but structure it so that if Firebase values are added later, it can automatically switch to cloud real-time sharing."

4. "In the meeting time grid, make it possible to drag across cells so that multiple time slots can be selected continuously."

5. "Design a lightweight 4-digit PIN flow to reduce the problem of users impersonating others by entering only a name."

6. "Design a home screen and project card structure so that one user can manage multiple team projects."

7. "Add a team chat feature. Design the message data structure and subscription flow."

8. "Explain the data flow in a React + Zustand structure where user actions trigger backend writes, subscriptions update the store, and the UI re-renders."

9. "Explain how to fix TypeScript and Vite environment variable type errors that occur during npm run build."

## AI Outputs We Modified / Verified

* **Initial MVP based on the requirement prompt**: The initial prompt required a frontend-only TeamFlow website with localStorage persistence. We reviewed and modified the generated structure so that the service flow matched the actual use case of college team projects.

* **Storage backend design change**: The initial implementation focused on localStorage. Later, we changed the design so that first-time users can still run the project without any setup, while Firebase can be used optionally. We separated storage logic by creating the `ProjectBackend` interface and two implementations: localStorage and Firebase (`src/lib/backend/`).

* **Maintaining localStorage-only execution**: The final project can still run without an external API, backend server, or Firebase configuration. Firebase is optional and is only used when environment variables are provided.

* **Member management validation**: We checked whether team members could be added, displayed as cards, and deleted correctly. We also checked how related role and task data behaved when members were changed.

* **Role assignment logic**: We checked whether predefined roles were assigned naturally even when the number of roles and the number of members were different. We adjusted the logic so that the result remained balanced and explainable.

* **Meeting time recommendation logic**: We verified that meeting times were counted by overlap and sorted by the number of available members. When multiple time slots had the same count, we added a secondary sorting rule so that the order remained predictable (`src/lib/meetingTime.ts`).

* **Meeting grid drag behavior**: A simple toggle method caused cells to flicker or switch unexpectedly while dragging. We fixed this by locking the drag mode based on the first selected cell, so dragging consistently paints or erases cells (`AvailabilityGrid.tsx`).

* **To-do and progress calculation**: We checked whether adding, completing, deleting, and assigning tasks correctly updated the total progress rate and member-level task counts.

* **Deadline and D-Day calculation**: We checked whether the D-Day value changed correctly based on the project deadline and whether overdue deadlines displayed the proper message.

* **Sample data member mapping**: We found that task `assigneeId` values could not be assigned correctly before member IDs were generated. We fixed this by mapping member names to generated IDs after members were created (`src/store/useStore.ts`).

* **Non-destructive sample project creation**: The initial sample loading behavior could erase the current project data. We changed it so that the sample is created as a separate new project instead of clearing existing work (`createSampleProject`).

* **Name + PIN lightweight authentication**: We found that name-only login allowed impersonation. We added a 4-digit PIN flow and stored the PIN as a SHA-256 hash with a name-based salt instead of storing it as plain text (`src/lib/hash.ts`). We also recognized that this is not a full security system and that a real production service would require a proper authentication provider.

* **Multi-project home screen**: We added a home screen so that one user can create, enter, and manage multiple projects instead of working with only one fixed project.

* **Team chat feature**: We added a project-level `messages` structure and a message subscription flow. We also implemented a chat UI that visually separates sent and received messages (`ChatPanel.tsx`).

* **TypeScript and Vite build fixes**: We fixed TypeScript project reference issues and `import.meta.env` type errors by adding the proper Vite environment type declaration (`src/vite-env.d.ts`).

* **Temporal Dead Zone bug fix**: While collecting member IDs for sample project creation, the local backend emitted its first snapshot synchronously during `subscribe()`. This caused the unsubscribe function to be called before it was initialized. We fixed this issue by introducing a safer control flow using a `settled` flag.

## How We Verified AI-Generated Code

* Ran `npm install` to check whether dependencies were installed correctly.
* Ran `npm run dev` to check whether the project worked in the local development environment.
* Ran `npm run build` to verify TypeScript compilation and production build.
* Tested localStorage mode without Firebase environment variables.
* Tested whether the app could switch to Firebase mode when Firebase environment variables were provided.
* Refreshed the page to confirm that team members, roles, meeting availability, to-dos, and project information were preserved.
* Added and deleted team members to check whether the UI and store state updated correctly.
* Ran automatic role assignment with different numbers of members and roles.
* Tested the meeting availability grid by dragging across multiple cells.
* Checked whether meeting time recommendations were sorted by the number of overlapping available members.
* Added, completed, and deleted to-dos to verify progress dashboard updates.
* Tested deadline highlighting for tasks with close due dates.
* Tested D-Day calculation for future deadlines.
* Tested overdue project deadlines to check whether the overdue message appeared correctly.
* Tested the data reset button and confirmed that the confirmation dialog appeared before deleting data.
* Tested sample project creation to make sure existing project data was not deleted.
* Tested first-time PIN registration, normal login, and wrong PIN input cases.
* Tested the team chat input and message display flow.
* Checked that private keys or credentials were not exposed in the repository.

## Core Files We Can Explain

* `src/App.tsx` — Connects the overall service flow by conditionally rendering the login screen, home screen, and project workspace.
* `src/types.ts` — Defines the core data types such as Member, Todo, ProjectMeta, Message, and SlotKey.
* `src/store/useStore.ts` — Acts as the center of state management and data flow. It mirrors backend subscription results into the store and defines the main actions.
* `src/lib/backend/index.ts` — Selects the storage implementation depending on whether Firebase environment variables are available.
* `src/lib/backend/local.ts` — Implements localStorage-based persistence so that the app can run without a backend server.
* `src/lib/backend/firebase.ts` — Implements optional Firebase-based real-time sharing.
* `src/lib/roleAssign.ts` — Implements the automatic role assignment algorithm.
* `src/lib/meetingTime.ts` — Calculates recommended meeting times by counting available members for each time slot.
* `src/lib/hash.ts` — Generates SHA-256 hashes for PIN storage instead of saving PINs as plain text.
* `src/components/auth/LoginScreen.tsx` — Handles the name + PIN login UI and user entry flow.
* `src/components/home/HomeScreen.tsx` — Handles the project list, new project creation, project entry, and sample project entry.
* `src/components/meeting/AvailabilityGrid.tsx` — Handles meeting availability selection through a draggable grid.
* `src/components/chat/ChatPanel.tsx` — Handles the team chat UI and message sending flow.
* `src/sampleData.ts` — Defines sample project data for testing and demonstration.
* `src/vite-env.d.ts` — Provides type declarations for Vite environment variables.

## What We Learned

* AI tools can quickly generate an initial project structure, but the generated code still needs to be reviewed and tested against the actual service requirements.
* Frontend-only projects can still provide useful functionality when localStorage is used carefully.
* Separating storage logic behind an interface makes the project easier to expand and maintain.
* Even when the first version only needs localStorage, designing the storage layer clearly makes later changes easier.
* AI-generated code often misses edge cases such as ID dependency, drag interaction behavior, synchronous subscription timing, and destructive sample data loading.
* A feature should not be added only because AI can generate it. It should support the actual user scenario.
* Deterministic algorithms are useful for role assignment and meeting time recommendation because the result can be explained through code.
* A lightweight PIN system is better than name-only access, but it is not a complete authentication system.
* Testing with realistic user actions is necessary because build success alone does not prove that the service flow works correctly.

## Note on AI API Usage

This project does not use an AI/LLM API inside the final service.

AI tools were used only as development assistants for coding, debugging, and improving the implementation. The service logic itself, such as role assignment, meeting time recommendation, D-Day calculation, task progress calculation, and localStorage persistence, is implemented with deterministic client-side logic.

The initial requirement was no external API, no backend server, and localStorage-based persistence. The final project still satisfies this requirement in local execution because it can run entirely in localStorage mode. Firebase support was added only as an optional extension for real-time sharing.
