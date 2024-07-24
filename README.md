# supaCRUD

supaCRUD is an in progress command-line interface tool designed to generate CRUD (Create, Read, Update, Delete) operations for your Supabase database tables in TypeScript projects.

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
- `-a, --all`: Generate all CRUD operations.
- `-c, --create`: Generate create operation.
- `-r, --read`: Generate read operation.
- `-u, --update`: Generate update operation.
- `-d, --delete`: Generate delete operation.
- `-s, --set-creds`: Update your Supabase credentials.

### Example

Run supaCRUD with no options:
```bash
supacrud
```

Specify a table to generate CRUD ops for:
```bash
supacrud --table users
```

Generate create and read ops for a users table:
```bash
supacrud -t users -c -r
```

Generate update and read ops for a users table:
```bash
supacrud -t posts -u -d
```

Generate all CRUD ops for a comments table:
```bash
supacrud -t comments -a
```

Update your Supabase credentials:
```bash
supacrud -s
```

If you don't specify any flags, supaCRUD will prompt you to choose an operation interactively.

## CRUD Operations

supaCRUD supports the following operations:

1. **All**: Add Create, Read, Update, Delete Ops for the specified table
2. **Create**: Add new records to your specified table
3. **Read**: View existing records and table structure
4. **Update**: Modify existing records in the table
5. **Delete**: Remove records from the table

For each table, supaCRUD generates corresponding .ts files in the `data/<table-name>/` directory containing the CRUD operations for that table.

## First-Time Setup (current implementation)

When you run supaCRUD for the first time, it will prompt you to enter your Supabase project URL and API key. These credentials will be stored locally for future use.

In the future, supaCRUD will infer the Supabase project URL and API key from local storage if `supabase login` has been run.

## Configuration

supaCRUD stores its configuration in:

```
~/.config/supaCRUD/config.json
```

This file contains your Supabase credentials.

## License

This project is licensed under the MIT License
