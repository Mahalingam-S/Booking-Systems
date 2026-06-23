# Vercel Deployment Setup Guide

This guide provides step-by-step instructions on how to deploy this full-stack application (Vite Frontend + Express Backend) to Vercel.

## 1. Prerequisites
Ensure that the following files are present in the root of your project. *(Note: These have already been created for you!)*
- `vercel.json`: Tells Vercel how to route traffic between your frontend and backend API.
- `api/index.ts`: The entry point that Vercel uses to deploy your Express backend as a Serverless Function.

## 2. Push Your Code to GitHub
1. Open your terminal or use your Git GUI.
2. Commit all your latest changes, including the `vercel.json` and `api/index.ts` files.
3. Push your code to your GitHub repository.

## 3. Import Project to Vercel
1. Go to your [Vercel Dashboard](https://vercel.com/dashboard) and log in.
2. Click the **"Add New..."** button in the top right corner and select **"Project"**.
3. Under the "Import Git Repository" section, locate your GitHub repository and click **"Import"**.

## 4. Configure Deployment Settings
Before clicking deploy, you need to configure your environment variables. 
1. **Framework Preset:** Leave this as the default (Vercel will auto-detect your project).
2. **Root Directory:** Leave this as the default (`./`).
3. Expand the **Environment Variables** section and add the following keys and values (copy these from your local `.env` file):

   - **`MONGODB_URI`**
     *Value:* `mongodb+srv://LabBookings:Mahal%409486@file-sharing.zwahsqa.mongodb.net/LabBookings?retryWrites=true&w=majority`
   - **`EMAIL_USER`**
     *Value:* `mahalingamshanmugam12@gmail.com`
   - **`EMAIL_PASS`**
     *Value:* Your email password/app password (e.g., `jawh pevn fspd izvy`)
   - **`PUBLIC_URL`**
     *Value:* You can temporarily leave this blank or put a placeholder. 

4. Click the **"Deploy"** button.

## 5. Post-Deployment Steps
Once the deployment finishes successfully:
1. Vercel will assign you a live domain name (e.g., `your-project-name.vercel.app`).
2. Go back to your Vercel Dashboard -> Project Settings -> **Environment Variables**.
3. Update the `PUBLIC_URL` variable to your new live Vercel domain (e.g., `https://your-project-name.vercel.app`).
4. Go to the **Deployments** tab and click **Redeploy** to apply the updated `PUBLIC_URL` variable.

Your full-stack application is now live!
