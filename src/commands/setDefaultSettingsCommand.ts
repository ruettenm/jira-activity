import * as settingsStore from 'settings-store'
import * as inquirer from 'inquirer'

export const setDefaultSettingsCommand = (settingsKey: string, message: string) => async () => {
    try {
        const { input } = await inquirer.prompt({
            message,
            name: 'input',
            default: settingsStore.value(settingsKey, undefined)
        }) as any

        settingsStore.setValue(settingsKey, input)

        process.exit(0)
    } catch (err) {
        console.error(err.message)
        process.exit(1)
    }
}
