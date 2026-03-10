Planned nginx routing:

- empirebuildsolutions.co.uk -> http://127.0.0.1:8001
- empirebuildsolutions.co.uk/tv -> http://127.0.0.1:8096/
- amare.empirebuildsolutions.co.uk -> leave unchanged
- bookinoo.empirebuildsolutions.co.uk -> http://127.0.0.1:5000

Files:

- empirebuildsolutions.co.uk.conf
- bookinoo.empirebuildsolutions.co.uk.conf

Current blockers to applying live:

1. `bookinoo.empirebuildsolutions.co.uk` does not currently resolve on this server.
2. Applying nginx changes requires sudo.
3. HTTPS for `bookinoo.empirebuildsolutions.co.uk` requires a certificate after DNS is pointed correctly.
