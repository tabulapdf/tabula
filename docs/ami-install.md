# Tabula EC2 AMI

An Amazon EC2 AMI image is provided to give you a chance to boot up a quick
test server:

* `ami-96d6b2ff` (US East - N. Virginia)
* `ami-feb3a68a` (EU - Ireland)

## Caveats

Note the [EC2 instance types](https://aws.amazon.com/ec2/instance-types/)
and [EC2 pricing](https://aws.amazon.com/ec2/pricing/). We’re not responsible
for any costs this may incur.

These images automatically update to tabula `master` branch. Please note that this
image is a development demo image and may not be secure. Using this AMI for
mission-critical or sensitive documents is currently not recommended.

## Quick Start

If you've got an Amazon AWS account and have EC2 enabled, here's how you
boot up an instance with our AMI:

1. Visit [aws.amazon.com](https://aws.amazon.com/), click on "AWS Management
   Console" (under "My Account/Console"), and log in:

    ![AWS homepage](https://d2p12wh0p3fo1n.cloudfront.net/files/20130403/aws1.png)

2. Click on the "EC2" section and press the "Launch Instance" button. From
   here, you should be presented with this menu (click on "Quick Launch Wizard"
   on the left if you’re on one of the other options):

    ![AMI quicklaunch](https://d2p12wh0p3fo1n.cloudfront.net/files/20130403/aws2.png)

3. Select the SSH keypair you want to use, and make sure you have "More Amazon
   Machine Images" selected, then click "Continue".

4. Under the "Public AMIs" tab, type `ami-96d6b2ff` (if you are in the US East AWS region)
   or `ami-feb3a68a` (EU AWS region) into the search box. If no AMIs are found, make sure your
   region is set to US East (N. Virginia) or EU (Ireland). (Note the ID in the image below will
   be different from the one you will type in.)

    ![search for the Tabula AMI](https://d2p12wh0p3fo1n.cloudfront.net/files/20130403/aws3.png)
    
5. Click "Continue". Optionally change the server type by clicking "Edit
   details". (Note the [EC2 instance types](https://aws.amazon.com/ec2/instance-types/)
   and [EC2 pricing](https://aws.amazon.com/ec2/pricing/).
   Tabula takes about a 60 seconds to process a short document (<10 pages)
   on the Micro and Small instances.)

   Go ahead and launch the server.

6. While the server’s booting up, you’ll need to open up port 80. Note the
   "Security Group" that your new server is using, then click on the "Security
   Groups" option in the lefthand sidebar.

7. Select the security group associated with your server, then click on the
   "Inbound" tab in the lower panel. Create a new rule for "HTTP", then press
   "Add Rule" and then "Apply Rule Changes".

    ![opening port 80](https://d2p12wh0p3fo1n.cloudfront.net/files/20130403/aws4.png)

   You should then notice the "80 (HTTP) --- 0.0.0.0/0" service listed in the
   table on the right.

8. Click on "Instances" in the sidebar, and click on your newly-launched
   instance. Underneath the instance’s identifier, you’ll see a domain name
   such as "ec2-123-123-123-123.compute-1.amazonaws.com".

   Open that web address in your browser. If it doesn’t come up right away,
   try again in a minute ro so. (If you continue to have issues, double-check
   the status of that instance in your "Instances" page.)

## Maintenance

[this section is a work-in-progress]

Note that the image uses an instance store and all data will be lost if the server is "Terminated".

As with other Ubuntu-based AWS servers, you can SSH into the server by using user `ubuntu` and
the private key you provided in step 3 above. (You may have to open the SSH port — see step 7 above,
but select port 22 instead.)

The easiest way to update Tabula to the latest `master` copy:

* SSH into the server (`ssh ubuntu@ec2-xxxxxxxxxxxx.xxxxxx.amazonaws.com`), pull the latest code,
  then reboot the server.

  ~~~
  cd ~/tabula
  git pull origin master
  sudo reboot
  ~~~
