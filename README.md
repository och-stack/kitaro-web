# GreenMetrics 🌱

**Less Waste. Greener Tomorrow.**

GreenMetrics is a proposed waste management and intelligence web platform designed to help Malaysian residents and small businesses access waste collection information, report waste-related issues, discover recycling centres, and understand waste management trends through data visualisation.

> **Project Status:** Planning and Checkpoint 1. Features, architecture, and deployment arrangements are subject to instructor review and approval.

## Table of Contents

- [Project Overview](#project-overview)
- [Problem Statement](#problem-statement)
- [Target Users](#target-users)
- [Core Features](#core-features)
- [Technology Stack](#technology-stack)
- [System Architecture](#system-architecture)
- [External Services](#external-services)
- [Database Design](#database-design)
- [Project Structure](#project-structure)
- [Deployment Plan](#deployment-plan)
- [Security Considerations](#security-considerations)
- [Development Roadmap](#development-roadmap)
- [Documentation](#documentation)

## Project Overview

GreenMetrics aims to bring waste management information and data analytics together in one web application.

The platform will help users find collection information, report waste-related problems, discover recycling facilities, and explore available waste management statistics.

## Problem Statement

Residents and small businesses may experience difficulties when trying to:

- Find waste collection information relevant to their area.
- Report and track missed collections, overflowing bins, and illegal dumping.
- Discover nearby recycling centres and check accepted materials.
- Understand waste generation, recycling trends, regional differences, and waste-related issues.

GreenMetrics aims to provide a centralised platform for these information and tracking needs. Data availability will depend on verified sources.

## Target Users

### Primary Users

- **Malaysian residents:** Access collection information, configure reminders, report waste problems, and find recycling facilities.
- **Small businesses and SMEs:** Access waste-related information and explore data to support waste management decisions.

### Potential Future Stakeholders

- Local authorities and waste management operators.
- Recycling and material recovery organisations.
- Businesses interested in waste management analytics.

These potential stakeholders will require further research to validate their needs and willingness to use the platform.

## Core Features

### 1. Smart Waste Collection Planner

- View collection schedules for supported areas.
- Search by postcode or area.
- View upcoming collection dates.
- Configure reminder preferences.

Collection schedules will initially use verified data entered into the application. The postcode API provides location information, not waste collection schedules.

### 2. Waste Issue Reporting and Tracking

- Report missed collections, overflowing bins, and illegal dumping.
- Submit descriptions, locations, and optional photos.
- View previously submitted reports.
- Track report statuses.

Planned statuses include `Submitted`, `In Progress`, and `Resolved`.

### 3. Nearby Recycling Centre Finder

- Search for recycling centres by area or material type.
- Open Google Maps search results or directions.
- Help users locate potential recycling facilities.

Users should verify opening hours and accepted materials before visiting.

### 4. Waste Intelligence and Analytics Dashboard

- Explore waste composition by material category.
- View waste and recycling trends across available periods.
- Compare regions using compatible indicators and units.
- Analyse waste reports by category, area, and status.

Charts will use verified datasets where available. Demonstration data will be labelled clearly and will not be presented as actual Malaysian statistics.

## Technology Stack

| Component | Technology | Purpose |
|---|---|---|
| Frontend | React + Vite | Build the user interface |
| UI Styling | Bootstrap | Create responsive layouts |
| Backend | Node.js + Express | Build REST API endpoints and business logic |
| Database | Supabase PostgreSQL | Store application data |
| Authentication | Supabase Auth | Manage registration and login |
| Data Visualisation | Recharts | Display analytics charts |
| Postcode Lookup | countries.dev Postal Code API | Retrieve available postcode-related location data |
| Recycling Discovery | Google Maps links | Help users find recycling facilities |
| Version Control | Git + GitHub | Manage source code and project documentation |

The final technology choices will be confirmed after instructor review and testing.

## System Architecture

The planned architecture separates the frontend, backend, database, authentication, and external services.