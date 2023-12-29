---
title: Restore a MS SQL Server backup on Linux
description: Because restoring a MS SQL Server backup from a Windows server onto your machine can be a pain
image:
  src: "@assets/blog-attachments/hero/restore-sql-backup-linux.jpg"
  alt: Bearded man seen from the back, sat in front of a computer screen. A loading wheel appears on said screen along with the title "Recovery"
pubDate: 2022-02-07
tags:
    - name: programming
      colorClass: bg-sky-600
    - name: sys-admin
      colorClass: bg-amber-600
    - name: sql
      colorClass: bg-lime-600
---

If you need to check the content of the backup you may use the following query:

```sql
RESTORE FILELISTONLY FROM DISK = '/path/to/file.bak'
```

Doing so will list the database stored in the backup file. What we are most interested in is the logical name, which is the name under which the DB appears and is queried through. For each database you should have two names: `YourDatabase` and `YourDatabase_Log` for the database and its logs respectively.

If you get an error stating that the file can't be found, you may need to move it into a folder accessible to mssql. A dedicated backup folder inside the app directory is usually a good idea:

```sh
sudo mkdir /var/opt/mssql/backup
sudo mv /path/to/file.bak /var/opt/mssql/backup/
```

To actually restore the database, simply use:

```sql
RESTORE DATABASE YourDatabase
FROM DISK = '/path/to/file.bak'
WITH MOVE 'YourDatabase' TO '/var/opt/mssql/data/YourDatabase.mdf',
MOVE 'YourDatabase_Log' TO '/var/opt/mssql/data/YourDatabase.ldf'
```

The two `MOVE` statement are the important part here since the backup will usually come from someone using WIndows, and will thus want to restore the database onto an invalid path.
