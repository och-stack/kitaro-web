# KITARO 

KITARO is a Malaysian waste-management platform designed to help households and small businesses manage waste reports, access waste collection information and make better waste-management decisions.

This repository contains the frontend application built with **React and Vite**, integrated with an Express.js backend and Supabase for authentication and database services.

## Project Plan

Refer to the [KITARO Project Plan](https://acrobat.adobe.com/id/urn:aaid:sc:AP:b0e3882e-c589-4e50-937f-3a83df40e3d3?x_api_client_id=chrome_extension_viewer&x_api_client_location=share) for the project objectives, scope, features and design direction.

## Tech Stack

- **React** – Frontend library for building user interfaces.
- **Vite** – Development server and build tool.
- **JavaScript** – Application logic.
- **Bootstrap** – Responsive UI styling and layout.
- **Supabase** – User authentication.
- **React Router** – Frontend navigation.
- **Fetch API** – Communication with the backend API.

## Features

- **User Authentication** – Register and log in securely.
- **Dashboard** – View waste-management information and analytics.
- **Profile Management** – View and update personal information.
- **Waste Collection Planner** – Access collection information based on location.
- **Waste Reporting** – Submit and track waste reports.
- **Admin Management** – Manage submitted waste reports and update their statuses.
- **Waste Analytics** – View waste hotspots, waste composition and reporting trends.

## Backend Integration

The frontend communicates with the Express.js backend to retrieve and manage application data.

**Production API:**

https://kitaro-server-indol.vercel.app

The backend handles:

- User authentication and authorization.
- Profile management.
- Malaysian postcode lookup.
- Waste report submission and retrieval.
- Administrator report management.
- Waste analytics through PostgreSQL functions.

Protected API requests include the Supabase access token in the Authorization header.

## Authentication & Security

- Supabase Authentication manages user registration and login.
- Access tokens authenticate protected API requests.
- Backend authorization restricts access to user-specific records.
- Administrator functions are restricted to authorized accounts.

## Testing

Frontend functionality is tested to ensure the application works as expected.

Testing focuses on:

- Component rendering.
- Waste report submission.
- Waste report retrieval.
- Report status updates.
- User and administrator interactions.

## Deployment

The frontend application is deployed separately from the backend.

The production frontend connects to the KITARO backend API hosted on Vercel.

## Additional Documentation

For backend API endpoints, request examples and response formats, refer to the [KITARO Backend Repository](https://github.com/och-stack/kitaro-server).

---

**KITARO Frontend**

Built with React, Vite, JavaScript and Supabase.