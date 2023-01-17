---
title: Rename Bandcamp single for easier consumption by MusicBrainz Picard
description: Learn how to organize singles downloaded from Bandcamp into artist/album/track so it can be consumed more easily
layout: ../../layouts/BlogPostLayout.astro
heroImage: /blog-attachments/hero/rename-bandcamp-singles.jpg
pubDate: Jan 16 2023
tags:
    - name: misc
      colorClass: bg-indigo-600
---

If you're like me, you probably have a bad habit of hoarding a lot of music from [Bandcamp](https://bandcamp.com) (that "buy entire discography" button has done some damage). Right after purchasing then downloading a bunch of albums, my first reflex is to enrich the metadata using [MusicBrainz's Picard](https://picard.musicbrainz.org) program. And the first thing you would do once inside Picard would be to cluster the releases automatically.

Unfortunately, if among the albums you just downloaded there happens to be some singles, you will quickly notice that Picard will cluster all those singles together, making it much harder to parse them. The issue come from the fact that, while downloading full albums will download a .zip that will be extracted into its own directory, singles will be downloaded directly as a single file, screwing up the directory organization.

If you are on Linux, you might have heard about a nice tool called `rename`. This tool is very handy for renaming a lot of files at once, and is also very useful for our purpose: organizing a bunch of separate files into folders. Here is the command I use:

```sh
/usr/local/bin/rename 's|(.*) - (.*).flac$|$1/$2/$2.flac|' *.flac
```

> **Note:** You will need the *Perl based* `rename` utility for this. On some distributions (such as Fedora), the default `rename` utility is a dumbed down version that takes 3 arguments, instead of the more powerful and regex based Perl one. You will thus need to install the Perl utility using *cpan*. You can follow [this solution](https://stackoverflow.com/questions/22577767/get-the-perl-rename-utility-instead-of-the-built-in-rename) for this purpose.
>
> **Note 2:** I left the `/usr/local/bin/` at the beginning of the command on purpose, as it is where the Perl utility should be installed by default. Doing so should make sure that it is the correct utility that is used.

For a given single such as `Extra Terra & Rogue VHS - Arrakis.flac`, the end result should be `Extra Terra & Rogue VHS/Arrakis/Arrakis.flac` thanks to the above command.
