#!/bin/bash

# Quick Start Script for Categories Feature
# This script helps you get the categories feature up and running

echo "======================================"
echo "Budget Buddy - Categories Feature"
echo "======================================"
echo ""

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "❌ Error: .env.local not found"
    echo "Please create .env.local with your Supabase credentials"
    exit 1
fi

echo "✅ Environment file found"
echo ""

# Remind about database migration
echo "⚠️  DATABASE MIGRATION REQUIRED"
echo ""
echo "Before running the app, you need to apply the database schema:"
echo ""
echo "1. Open https://supabase.com/dashboard"
echo "2. Go to SQL Editor"
echo "3. Copy contents of: supabase/categories_schema.sql"
echo "4. Paste and execute the SQL"
echo ""
read -p "Have you applied the database migration? (y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo "Please apply the migration first, then run this script again."
    exit 1
fi

echo ""
echo "✅ Great! Starting development server..."
echo ""

# Start the dev server
npm run dev

