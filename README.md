# JIRA activity
This tool parses your jira activity stream and returns a list of your workitems grouped by day. 
The official atlassian documentation for the jira activity stream can be found [here](https://developer.atlassian.com/server/framework/atlassian-sdk/consuming-an-activity-streams-feed).

## How to use
### Initial setup
```bash
# installation
npm i -g jira-activity

# setup your defaults
jira-activity hostname some.hostname
jira-activity username your@username.com
```

### Show your activity
```bash
# if you have set your defaults
jira-activity list

# if you do not have defaults or wants to override them
jira-activity list -u your@username.com -h some.hostname

# if you only want to see your activities for the current week or month
jira-activity list -f week
jira-activity list -f month
```
![Example Image](https://raw.githubusercontent.com/ruettenm/jira-activity/master/img/example.png)

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
