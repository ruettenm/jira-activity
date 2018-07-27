# JIRA activity

## How to use
### Initial setup
```bash
# installation
npm i -g jira-activity

# setup your defaults
jira-activity hostname some.hostname
jira-activity hostname your@username.com
```

### Show your activity
```bash
# if you have set your defaults
jira-activity list

# if you do not have defaults or wants to override them
jira-activity list -u your@username.com -h some.hostname
```

## How to develop
### Initial setup
```bash
nvm use

npm i yarn@1.6.0
```

### How to call the library
```bash
yarn dev [command]

# e.g. >>
yarn dev list
yarn dev defaults
```
