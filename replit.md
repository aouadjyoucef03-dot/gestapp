# Overview

ChickMaster Pro is a comprehensive poultry farm management system designed for professional chick management and optimization. The application provides AI-powered environmental calculations, real-time equipment control, growth tracking, and comprehensive monitoring tools for poultry farms. It features a modern web interface built with React and TypeScript, backed by a Node.js Express server with PostgreSQL database storage.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
The client-side application is built using React with TypeScript and follows a component-based architecture. Key architectural decisions include:

- **UI Framework**: Uses Radix UI components with shadcn/ui for consistent, accessible design patterns
- **Styling**: Tailwind CSS with custom design tokens and CSS variables for theming
- **State Management**: TanStack Query (React Query) for server state management and caching
- **Routing**: Wouter for lightweight client-side routing
- **Form Handling**: React Hook Form with Zod validation for type-safe form management
- **Build Tool**: Vite for fast development and optimized production builds

The application uses a modular component structure with specialized components for different farm management aspects (environmental controls, growth projections, feed tracking, etc.).

## Backend Architecture
The server follows a RESTful API design with Express.js and includes:

- **API Structure**: RESTful endpoints organized by resource type (farms, flocks, equipment, readings)
- **Data Validation**: Zod schemas for input validation and type safety
- **Storage Layer**: Abstracted storage interface with in-memory implementation for development
- **Environmental Calculations**: AI-powered algorithms for temperature, humidity, and ventilation optimization
- **Real-time Updates**: Periodic data refresh for environmental monitoring

## Database Design
Uses PostgreSQL with Drizzle ORM for type-safe database operations:

- **Core Entities**: Farms, flocks, equipment, environmental readings, feed/water records
- **Relationships**: Farm-centric design with flocks and equipment belonging to farms
- **Schema Management**: Drizzle migrations for version control
- **Data Types**: Optimized for numeric calculations and JSON specifications

The schema supports complex equipment specifications and flexible environmental data tracking.

## Development Workflow
- **Monorepo Structure**: Client, server, and shared code in unified workspace
- **Type Safety**: Full TypeScript coverage with shared schemas between frontend and backend
- **Development Mode**: Vite dev server with Express API integration
- **Hot Reloading**: Real-time updates during development

# External Dependencies

## Database Services
- **Neon Database**: PostgreSQL-compatible serverless database service
- **Drizzle ORM**: Type-safe database toolkit with migration support
- **Connection Pooling**: Built-in connection management for scalability

## UI and Component Libraries
- **Radix UI**: Accessible, unstyled React components for complex interactions
- **Tailwind CSS**: Utility-first CSS framework for rapid styling
- **Lucide React**: Consistent icon library for interface elements
- **React Hook Form**: Performant form library with validation

## Development and Build Tools
- **Vite**: Fast build tool with HMR and optimized bundling
- **TypeScript**: Static typing for enhanced developer experience
- **ESLint/Prettier**: Code quality and formatting tools
- **Replit Integration**: Platform-specific plugins for development environment

## Data Management
- **TanStack Query**: Powerful data fetching with caching and synchronization
- **Zod**: Runtime type validation and parsing
- **Date-fns**: Lightweight date manipulation library

## Authentication and Session Management
- **Express Session**: Server-side session management
- **Connect-pg-simple**: PostgreSQL session store integration

The application is designed to be deployed on cloud platforms with minimal configuration, supporting both development and production environments through environment-specific builds.