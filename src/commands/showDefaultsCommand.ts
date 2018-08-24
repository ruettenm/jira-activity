import * as settingsStore from 'settings-store'

export const showDefaultsCommand = () => {
    const { username, hostname } = settingsStore.value('settings')

    console.info('These are your current default settings:')
    console.info('* username:', username || 'not set')
    console.info('* hostname:', hostname || 'not set')

    process.exit(0)
}
