# Shared rules and gravity — B owns

Put the validated source-backed dataset in data/ and pure timing/rule helpers in src/. NASA reference: https://nssdc.gsfc.nasa.gov/planetary/factsheet/

Plan values: Earth 9.8, Mars 3.7, Moon 1.6 m/s². Verify against the cited source when creating the dataset and include source, units, retrieval date and version. Do not claim data exists before adding it.

Proposed timing: 0.8 × sqrt(9.8 / gravity) seconds, about 0.8/1.3/2.0 seconds. This is an explicit gameplay transformation, not a universal physical law. Server is authoritative. Add focused comparison tests when implementing.
