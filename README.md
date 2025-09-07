# AgencyFlow

AgencyFlow is a comprehensive, open-source solution designed to help agencies and freelancers manage their projects, clients, and finances efficiently. It provides a unified platform for tracking project progress, managing tasks, handling invoicing, and collaborating with clients.

## ✨ Features

- **Dashboard:** An overview of your agency's performance, including project statuses, financial summaries, and recent activities.
- **Project Management:** Create and manage projects, assign tasks, set deadlines, and track progress with a Kanban board and Gantt charts.
- **Client Management:** Keep all your client information organized in one place.
- **Financials:** Create and send quotations and invoices. Track project expenses and profitability.
- **Task Management:** A dedicated "My Tasks" view for team members to see their assigned tasks.
- **Client Portal:** A separate dashboard for clients to view their project progress, approve files, and manage their invoices.
- **File Management:** Upload project files and manage a file approval workflow with clients.
- **Authentication & Authorization:** Role-based access control for admins, project managers, members, and clients.

## 🛠️ Tech Stack

- **Framework:** [Next.js](https://nextjs.org/) (App Router)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **UI Components:** [shadcn/ui](https://ui.shadcn.com/)
- **ORM:** [Prisma](https://www.prisma.io/)
- **Database:** [PostgreSQL](https://www.postgresql.org/)
- **Authentication:** [NextAuth.js](https://next-auth.js.org/)

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/en/) (v18 or later)
- [pnpm](https://pnpm.io/)
- A running [PostgreSQL](https://www.postgresql.org/) database instance.

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/agencyflow.git
    cd agencyflow
    ```

2.  **Install dependencies:**
    ```bash
    pnpm install
    ```

3.  **Set up environment variables:**

    Create a `.env` file in the root of the project and add the necessary environment variables. See the [Environment Variables](#-environment-variables) section for details.

4.  **Run database migrations:**

    This will apply the database schema to your PostgreSQL database.
    ```bash
    pnpm prisma migrate dev
    ```

5.  **Seed the database:**

    This will populate the database with initial data (e.g., user roles).
    ```bash
    pnpm prisma db seed
    ```

6.  **Run the development server:**
    ```bash
    pnpm dev
    ```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 🌐 Environment Variables

To run this project, you need to set the following environment variables in a `.env` file:

```env
# Database URL for Prisma
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"

# NextAuth.js settings
# You can generate a secret using: openssl rand -base64 32
NEXTAUTH_SECRET="YOUR_NEXTAUTH_SECRET"
NEXTAUTH_URL="http://localhost:3000"
```

## ☁️ Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.