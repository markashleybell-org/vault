About Vault
=========

Vault is a very simple ASP.NET MVC web application for storing encrypted personal login details (usernames, passwords etc). It uses the [Passpack Host-Proof Hosting package](http://code.google.com/p/passpack/) to do all encryption and decryption on the client and avoid passing vulnerable plain-text data to the server. 

Although all data is encrypted before transmission over HTTP, as an extra precaution **this application should *always* be used over an SSL-encrypted connection**.

*Please Note:* Due to the use of the native `window.atob` and `window.btoa` functions, Vault only works in Firefox, Chrome, Safari or Internet Explorer *10+*.

External Libraries/Dependencies
========================

* Vault uses [jQuery](http://jquery.com/), [Handlebars.js](http://handlebarsjs.com/) for client-side templating and [Bootstrap](http://getbootstrap.com/) for layout/UI widgets. 
* Encryption is handled by the [Passpack Host-Proof Hosting package](http://code.google.com/p/passpack/).
