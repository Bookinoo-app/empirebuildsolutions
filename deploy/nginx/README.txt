Reference nginx routing:

- empirebuildsolutions.co.uk -> http://127.0.0.1:8001
- empirebuildsolutions.co.uk/tv -> http://127.0.0.1:8096/
- amare.empirebuildsolutions.co.uk -> leave unchanged
- bookinoo.empirebuildsolutions.co.uk -> http://127.0.0.1:5000

Files:

- empirebuildsolutions.co.uk.conf
- bookinoo.empirebuildsolutions.co.uk.conf

Notes:

1. Live traffic is currently handled through Cloudflare Tunnel rather than nginx as the primary public entrypoint.
2. These files remain useful as reference server configs or if routing is moved back behind nginx later.
3. `amare.empirebuildsolutions.co.uk` should remain untouched unless the Amare deployment changes separately.
