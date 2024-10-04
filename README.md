# supacrud

supacrud is an in progress command-line interface tool designed to generate CRUD (Create, Read, Update, Delete) operations for your Supabase database tables in TypeScript projects.

## Installation

To install supacrud, make sure you have Node.js and npm installed, then run:

```bash
npm install -g supacrud
```

## Usage

After installation, you can use supacrud by running the `supacrud` command in your terminal:

```bash
supacrud [OPTIONS]
```

### Options

- `-t, --table <table-name>`: Specify the table name to perform CRUD operations on. If not provided, you can select from a dropdown of existing tables in your database.
- `-a, --all`: Generate all CRUD operations.
- `-c, --create`: Generate create operation.
- `-r, --read`: Generate read operation.
- `-u, --update`: Generate update operation.
- `-d, --delete`: Generate delete operation.
- `-s, --set-creds`: Update your Supabase credentials.

### Examples

Run supacrud with no options to select a table from your supabase database:
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

If you don't specify any flags, supacrud will prompt you to choose an operation interactively.

## CRUD Operations

supacrud supports the following operations:

1. **All**: Add Create, Read, Update, Delete Ops for the specified table
2. **Create**: Add new records to your specified table
3. **Read**: View existing records and table structure
4. **Update**: Modify existing records in the table
5. **Delete**: Remove records from the table
6. **List**: List all records in a table

For each table, supacrud generates corresponding .ts files in the `data/<table-name>/` directory containing the CRUD operations for that table.

## Configuration

supacrud stores its configuration in:

```
~/.config/supacrud/<project-name>/config.json
```

This file contains your Supabase credentials.

## License

This project is licensed under the MIT License
