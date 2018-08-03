#!/usr/bin/env node

import * as program from 'commander'
import * as inquirer from 'inquirer'
import * as cliSpinner from 'cli-spinner'
import * as settingsStore from 'settings-store'

import { getActivities, JiraSettings } from './jira'
import { print } from './print'

settingsStore.init({
    appName: 'jira-activity',
    reverseDNS: 'de.ruettenm.jira-activity'
})

const spinner = new cliSpinner.Spinner('accessing jira.. %s');
spinner.setSpinnerString('|/-\\');

const setDefaultHostnameCommand = async () => {
    try {
        const { hostname } = await inquirer.prompt({
            message: 'Enter your default JIRA hostname (e.g. jira.codecentric.de)',
            name: 'hostname',
            default: settingsStore.value('settings.hostname', undefined)
        }) as any

        settingsStore.setValue('settings.hostname', hostname)

        process.exit(0)
    } catch (err) {
        console.error(err.message)
        process.exit(1)
    }
}

const setDefaultUsernameCommand = async () => {
    try {
        const { username } = await inquirer.prompt({
            message: 'Enter your default JIRA username (e.g. matthias.ruetten@codecentric.de)',
            name: 'username',
            default: settingsStore.value('settings.username', undefined)
        }) as any

        settingsStore.setValue('settings.username', username)

        process.exit(0)
    } catch (err) {
        console.error(err.message)
        process.exit(1)
    }
}

const showDefaultsCommand = () => {
    const { username, hostname } = settingsStore.value('settings')

    console.info('These are your current default settings:')
    console.info('* username:', username || 'not set')
    console.info('* hostname:', hostname || 'not set')

    process.exit(0)
}

const listActivityCommand = async (command: any) => {
    try {
        const hostname = command.hostname || settingsStore.value('settings.hostname')
        const username = command.username || settingsStore.value('settings.username')
        const maxResults = command.max || 200

        if (!hostname || !username) {
            console.info('Please specify your username and hostname either per command options or defaults.')
            console.info('jira-activity --help')

            showDefaultsCommand()
        } else {
            const { password } = await inquirer.prompt({
                type: 'password',
                message: 'Enter your password',
                mask: '*',
                name: 'password'
            }) as any

            const jiraSettings: JiraSettings = {
                username,
                password,
                hostname
            }

            spinner.start()
            const activities = await getActivities(jiraSettings, maxResults)
            spinner.stop(true)

            print(activities)
        }

        process.exit(0)
    } catch (err) {
        console.error(err.message)
        process.exit(1)
    }
}

program
    .command('list')
    .action(listActivityCommand)
    .option('-h, --hostname <hostname>', 'specifies the hostname which is used')
    .option('-u, --username <username>', 'specifies the username which is used')
    .option('-m, --max <number>', 'specifies the number of max results. The default is: 200', parseInt)
    .description('Loads your activity and lists the parent issues you have worked on grouped by day')

program
    .command('hostname')
    .description('Saves the default hostname (e.g. jira.codecentric.de)')
    .action(setDefaultHostnameCommand)

program
    .command('username')
    .description('Saves the default username (e.g. matthias.ruetten@codecentric.de)')
    .action(setDefaultUsernameCommand)

program
    .command('defaults')
    .description('Shows your current default settings')
    .action(showDefaultsCommand)

program.parse(process.argv)

if (program.args.length === 0) {
    program.help()
}
