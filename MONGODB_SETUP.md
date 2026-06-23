# MongoDB Atlas Setup Guide

This guide outlines the steps required to set up a cloud-hosted MongoDB database using MongoDB Atlas and connect it to your application.

## 1. Create a MongoDB Atlas Account
1. Navigate to the [MongoDB Atlas Registration Page](https://www.mongodb.com/cloud/atlas/register).
2. Sign up for a new account or log in with your existing credentials (such as your Google account).

## 2. Create a Free Cluster
1. Once logged in, you will be prompted to deploy a cloud database.
2. Select **M0 Free** (the free tier cluster).
3. Choose your preferred **Cloud Provider** (AWS, Google Cloud, or Azure) and a **Region** that is closest to your users.
4. Keep the default cluster name (usually `Cluster0`) or rename it.
5. Click **Create Deployment**.

## 3. Configure Database Credentials
1. After creating the cluster, you will need to create a database user to access it.
2. Enter a **Username** and a secure **Password**.
3. *Important: Save this username and password somewhere safe, as you will need them for the connection string.*
4. Click **Create Database User**.

## 4. Set Up Network Access
By default, MongoDB Atlas restricts access to your database. You need to allow your application to reach it.
1. In the "Where would you like to connect from?" section, select **My Local Environment**.
2. Click **Add IP Address**.
3. To allow connections from any IP (which is required since Vercel uses dynamic IP addresses), enter `0.0.0.0/0`.
4. Click **Finish and Close**.

## 5. Get Your Connection String (URI)
1. Go to your **Database** dashboard (under "Deployment" on the left sidebar).
2. Click the **Connect** button next to your cluster.
3. Select **Drivers** under "Connect to your application".
4. Copy the connection string provided. It will look something like this:
   `mongodb+srv://<username>:<password>@cluster0.abcde.mongodb.net/?retryWrites=true&w=majority`
5. Replace `<username>` and `<password>` with the credentials you created in Step 3.
6. Optional: Specify the database name by inserting it before the `?` mark. For example: `...mongodb.net/Bookings?retryWrites...`

## 6. Connect Your Application
1. **Local Development:** Open your `.env` file and set the `MONGODB_URI` variable:
   ```env
   MONGODB_URI="mongodb+srv://<username>:<password>@cluster0.abcde.mongodb.net/Bookings?retryWrites=true&w=majority"
   ```
2. **Vercel Deployment:** Go to your Vercel Dashboard -> Project Settings -> Environment Variables, and add `MONGODB_URI` with the connection string as the value.

Your application is now successfully connected to MongoDB Atlas!
