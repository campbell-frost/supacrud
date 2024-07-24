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

Specify a table to work with:
```bash
supacrud
supacrud --table users
supacrud -t users -c -r
supacrud -t posts -u -d
supacrud -t comments -a
supacrud -s
```

If you don't specify any flags, supaCRUD will prompt you to choose an operation interactively.

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

This file contains your Supabase credentials.

## License

This project is licensed under the MIT License
