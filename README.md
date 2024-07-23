# supaCRUD

supaCRUD is an in progress command-line interface tool designed to generate CRUD operations on your Supabase database tables for TypeScript projects.

## Installation

To install supaCRUD, make sure you have Node.js and npm installed, then run:

```bash
npm install -g supacrud
```

## Usage

After installation, you can use supaCRUD by running the `supacrud` command in your terminal:

```bash
supacrud [OPTIONS]
```

### Options

- `-t, --table <table-name>`: Specify the table name to perform CRUD operations on.

### Example

Specify a table to work with:
```bash
supacrud --table users
```

This will give you options relating to what you CRUD operations you want to do to this table

## CRUD Operations

supaCRUD supports the following operations:

1. **Create**: Add new records to your specified table
2. **Read**: View existing records and table structure
3. **Update**: Modify existing records in the table
4. **Delete**: Remove records from the table
5. **All**: Add CRUD operations for all of the above

For each table, supaCRUD generates corresponding .ts files in the `data/<table-name>/` directory containing the CRUD operations for that table.

## First-Time Setup (current implementation)

When you run supaCRUD for the first time, it will prompt you to enter your Supabase project URL and API key. These credentials will be stored locally for future use.

In the future, supaCRUD will infer the Supabase project URL and API key from local storage if `supabase login` has been run.

## Configuration

supaCRUD stores its configuration in:

```
~/.config/supaCRUD/config.json
```

This file contains your Supabase credentials. Handle it with care and do not share it.

## License

This project is licensed under the MIT License
