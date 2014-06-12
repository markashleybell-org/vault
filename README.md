About Vault
=========

Vault is a very simple ASP.NET MVC web application for storing encrypted personal login details (usernames, passwords etc). It uses the [Passpack Host-Proof Hosting package](http://code.google.com/p/passpack/) to do all encryption and decryption on the client and avoid passing vulnerable plain-text data to the server. 

Although all data is encrypted before transmission over HTTP, as an extra precaution **this application should *always* be used over an SSL-encrypted connection**.

*Please Note:* Due to the use of the native `window.atob` and `window.btoa` functions, Vault only works in Firefox, Chrome, Safari or Internet Explorer *10+*.

External Libraries/Dependencies
========================

* Vault uses [jQuery](http://jquery.com/), [jQuery UI](http://jqueryui.com/) and images/CSS from the 'Flick' theme found at [ThemeRoller](http://jqueryui.com/themeroller/). 
* Icons are from the excellent [Silk](http://www.famfamfam.com/lab/icons/silk/) collection by [Mark James](http://www.famfamfam.com/). 
* Table sort/filter/pagination courtesy of the [DataTables](http://www.datatables.net/) jQuery plugin by [Allan Jardine](http://www.sprymedia.co.uk/).
* Encryption is handled by the [Passpack Host-Proof Hosting package](http://code.google.com/p/passpack/).
