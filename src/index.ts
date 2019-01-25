#!/usr/bin/env node

import * as program from 'commander'
import * as settingsStore from 'settings-store'

import { listActivityCommand } from './commands/listActivityCommand'
import { setDefaultSettingsCommand } from './commands/setDefaultSettingsCommand'
import { showDefaultsCommand } from './commands/showDefaultsCommand'

settingsStore.init({
    appName: 'jira-activity',
    reverseDNS: 'de.ruettenm.jira-activity'
})

program
    .command('list')
    .action(listActivityCommand)
    .option('-h, --hostname <hostname>', 'specifies the hostname which is used')
    .option('-u, --username <username>', 'specifies the username which is used')
    .option('-f, --filter <type>', 'filters the list to the current week or month [type: week or month]')
    .option('-v, --verbose', 'run in verbose mode')
    .option('-m, --max <number>', 'specifies the number of max results. The default is: 500', parseInt)
    .description('Loads your activity and lists the parent issues you have worked on grouped by day')

program
    .command('hostname')
    .description('Saves the default hostname (e.g. jira.codecentric.de)')
    .action(setDefaultSettingsCommand('settings.hostname', 'Enter your default JIRA hostname (e.g. jira.codecentric.de)'))

program
    .command('username')
    .description('Saves the default username (e.g. matthias.ruetten@codecentric.de)')
    .action(setDefaultSettingsCommand('settings.username', 'Enter your default JIRA username (e.g. matthias.ruetten@codecentric.de)'))

program
    .command('defaults')
    .description('Shows your current default settings')
    .action(showDefaultsCommand)

program.parse(process.argv)

if (program.args.length === 0) {
    program.help()
}
