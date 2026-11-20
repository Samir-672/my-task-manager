# Task Manager Interview Questions

## Q1. What is your Task Manager project?

It is a web app where I can create, edit, search, filter, complete, and delete personal tasks. React displays the pages, an Express API handles requests, and Supabase PostgreSQL stores the tasks.

## Q2. Which React concepts did you use?

I used functional components, JSX, props, `useState`, `useEffect`, event handling, conditional rendering, lists with `map()`, filtering with `filter()`, and controlled forms.

## Q3. How can you add a task?

I open the task form, enter a title, description, and priority, and submit it. React calls the API, the API validates the input and inserts it into PostgreSQL, and the dashboard reloads the task list.

## Q4. How can you delete a task?

I click Delete, confirm the action, and React sends a DELETE request to the API. The API deletes the matching PostgreSQL row and the UI refreshes the list.

## Q5. How can you mark a task as completed?

I click the task's checkbox. React sends a PATCH request with the new status, and the API saves that status in PostgreSQL. Clicking it again changes the task back to Pending.

## Q6. What is `useState`?

`useState` is a React Hook for storing values that can change while a component is open. When a state setter runs, React renders the component again with the new value.

## Q7. What is `useEffect`?

`useEffect` runs side-effect code after React renders. In this app it loads tasks from the API when the dashboard first appears.

## Q8. What are props?

Props are values a parent component passes to a child component. For example, the dashboard passes a task and event handlers to each task card.

## Q9. What is conditional rendering?

Conditional rendering means showing different UI depending on a condition. This app shows a loading message while tasks load, an empty state when there are no tasks, and dialogs only when they are needed.

## Q10. How does React communicate with the backend?

The frontend uses `fetch()` in `src/services/taskApi.js` to send HTTP requests to the Express API. The API returns JSON, which React uses to update the task state.

## Q11. How does your application store data?

Task data is stored in the Supabase PostgreSQL database, in the `public.tasks` table. The frontend does not use temporary sample data as its task store.

## Q12. What is CRUD?

CRUD stands for Create, Read, Update, and Delete. These are the four basic operations this app performs on tasks.

## Q13. What is a REST API?

A REST API exposes resources through URLs and uses HTTP methods such as GET, POST, PUT, PATCH, and DELETE to work with those resources.

## Q14. Why did you use Supabase PostgreSQL?

PostgreSQL is a relational database that stores structured task records and supports constraints and identity columns. Supabase provides a hosted PostgreSQL database and connection tools for the project.

## Q15. How do you handle errors?

The frontend catches API errors and shows a message to the user. The Express API validates requests and uses centralized error middleware. Detailed server errors are logged on the backend instead of being exposed to the browser.
