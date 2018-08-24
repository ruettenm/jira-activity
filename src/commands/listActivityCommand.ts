import * as settingsStore from 'settings-store'
import * as inquirer from 'inquirer'
import * as moment from 'moment'
import * as cliSpinner from 'cli-spinner'

import { getActivities, JiraSettings } from '../jira'
import { print } from '../print'
import { showDefaultsCommand } from './showDefaultsCommand'

const spinner = new cliSpinner.Spinner('accessing jira.. %s')
spinner.setSpinnerString('|/-\\')

export const listActivityCommand = async (command: any) => {
    try {
        const hostname = command.hostname || settingsStore.value('settings.hostname')
        const username = command.username || settingsStore.value('settings.username')
        const maxResults = command.max || 500
        const filter = command.filter

        if (filter) {
            if (!['week', 'month'].includes(filter)) {
                console.error('Please use the term "week" or "month" to filter the output')
                process.exit(1)
            }
        }

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
            const activities = await getActivities(
                jiraSettings,
                maxResults,
                filter ? moment().startOf(filter).unix() * 1000 : undefined
            )
            spinner.stop(true)

            print(activities)
        }

        process.exit(0)
    } catch (err) {
        console.error(err.message)
        process.exit(1)
    }
}
