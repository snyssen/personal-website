---
title: Safely delete large number of records by using a loop
description: Deleting a large number of rows is risky in SQL as it involves a resource intensive transaction. This article presents a method to split that single transaction into multiple smaller ones.
layout: ../../layouts/BlogPostLayout.astro
pubDate: Jan 16 2023
tags:
    - name: programming
      colorClass: bg-sky-600
    - name: sys-admin
      colorClass: bg-amber-600
    - name: sql
      colorClass: bg-lime-600
---

I sometime need to delete up to millions of rows in our database and I can't simply do a raw `DELETE` statement as such a huge query would mean having a very large transaction that would consume a lot if not all of the resources available. The simple alternative is to use an SQL loop, such as the following:

```sql
WHILE 1 = 1
BEGIN
   DELETE TOP(5000)
   FROM <table_name>
   WHERE <predicate>;
   IF @@ROWCOUNT < 5000 BREAK;
END
```

This way, each loop implicitly initiates its own transaction and each of those transactions has a reasonable size. However, remember that this is simply a quick and dirty trick, as there are [way more efficient methods of deleting really large number of rows](https://blogs.oracle.com/sql/how-to-delete-millions-of-rows-fast-with-sql).

**If you need to delete every row of a table**, you should use the `TRUNCATE` statement instead since it is so much faster, like so:

```sql
TRUNCATE TABLE <table_name>
```
