## jsonwp-status

Library of status codes for the Selenium [JSON Wire Protocol](https://github.com/SeleniumHQ/mobile-spec/blob/master/spec-draft.md).


### Usage

```
import { statusCodes } from 'armor-base-driver';

statusCodes.NoSuchContext;
// -> {code: 35, summary: 'No such context found'}
```

```
import { getSummaryByCode } from 'armor-base-driver';

getSummaryByCode(0);
// -> 'The command executed successfully.'
```
