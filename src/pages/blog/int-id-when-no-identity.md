---
title: Generate new (random) integer ID when ID column is not identity
description: Tip to generate integer IDs in SQL databases when the ID column does not have the identity specification
layout: ../../layouts/BlogPostLayout.astro
heroImage: /blog-attachments/hero/int-id-when-no-identity.jpg
pubDate: Nov 09 2022
tags:
    - name: programming
      colorClass: bg-sky-600
    - name: sys-admin
      colorClass: bg-amber-600
    - name: sql
      colorClass: bg-lime-600
---

Sometime you have to insert values into a database table that has a primary column which do not use the identity feature. In such case, you have to generate a unique ID for each inserted record. The best way I have found to do this is to randomly generate said new ID for each new record. This solution is inspired by [this StackOverflow answer](https://stackoverflow.com/a/18408615/10351751).

## How I do this

```sql
SELECT ABS(CHECKSUM(NEWID()) % (2147483647 - (SELECT MAX(Id) FROM your_table) + 1)) + (SELECT MAX(Id) FROM your_table)
```

I know, it's not looking good, but as I said it's the best way I found for now...
If you are wondering why `2147483647` is there, it's simply because it is the max value for an int in an SQL database. Basically the expression above is a modified version of this:

```sql
SELECT ABS(CHECKSUM(NEWID()) % (@max - @min + 1)) + @min
```

which generates a random number between `@min` and `@max` on each call.
