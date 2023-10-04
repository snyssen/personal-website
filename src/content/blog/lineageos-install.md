---
title: Install LineageOS with MicroG and playstore
description: Install LineageOS with MicroG and full playstore support
image:
  src: "@assets/blog-attachments/hero/lineage-os-logo.webp"
  alt: Official lineage os logo
pubDate: 2022-07-23
tags:
    - name: misc
      colorClass: bg-indigo-600
---

You should first check that your device is compatible with LineageOS. To do so, head to [https://download.lineageos.org](https://download.lineageos.org/) and search for your device in the list. If your device is not present, you will unfortunately not be able to go any further.

If you find your device, search for the link to the installation instructions. It should appear above the list of downloads:

![Sreenshot showing where to find the installation instructions](@assets/blog-attachments/miscellaneous/lineage-os-downloads.png)

You should then follow the instructions provided there **exactly** up to the point where **they install LineageOS from recovery.** At this point, you should head on to [https://download.lineage.microg.org](https://download.lineage.microg.org/) and search for the correct build for your device (i.e. _Guacamole_ for the OnePlus 7). In the folder for the correct build, download the latest version of the zip file containing the image to be flashed. Once you have the file, return to the instruction page for LineageOS and continue with their instruction but use the LineageOS for MicroG image you just downloaded instead.

Once the installation is done, reboot your device and follow the on-screen first time instructions.You should now have a fully functional (if only a bit bare bone) open-source and tracker free Android device ! Now, open the F-Droid store, wait for it to updates its repositories then search for _Magisk_ and install it. Once _Magisk_ is installed, open the app and follow [the official install instructions](https://topjohnwu.github.io/Magisk/install.html). After rebooting your device, open the _Magisk_ app to check it was installed correctly. You should now have a small navigation menu at the bottom of the app. If the navigation menu isn't there then _Magisk_ is not installed correctly on your device.

> **Note for OnePlus devices:** The official Magisk installation guide requests that you extract the `boot.img` file from the LineageOS+MicroG zip. You will however soon find out that your zip file doesn't contain such file. You will indeed need to rebuild it from the payload.bin file, by using the [payload dumper tool](https://www.mediafire.com/file/pslxh616isribx6/payload_dumper.zip/file). Please follow the instruction guide [here](https://tech-latest.com/extract-boot-img-from-oneplus-oxygenos/) to build your `boot.img` file.

Finally, download the latest version of the [FakeStore 2 PlayStore](https://github.com/sn-00-x/fakestore2playstore/releases) plugin and copy its zip onto your device. Then open the Magisk app, go into the plugin tabs (the last one) and click on _Install from storage_. Select the previously downloaded zip and let Magisk do the installation. When it's done, click on _Reboot_ to reboot your device. Once your device reboot, you should see that the Google Play store was installed. Click on it, log in and you should now be able to install any app from the store and make any purchases in it !

As a final note, I also recommend installing the Aurora store from F-Droid. This store is an alternative client to the Google Play store which is in my opinion more pleasing to use but also allows you to browse the store anonymously as well as have extra information on the app you want to download such as the tracker used.
