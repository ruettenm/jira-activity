import * as request from 'superagent'
import * as settingsStore from 'settings-store'
const xml2js = require('xml2js-es6-promise');

settingsStore.init({
    appName: 'jira-activity',
    reverseDNS: 'de.ruettenm.jira-activity'
})

export interface JiraSettings {
    hostname: string
    username: string
    password: string
}

export interface CachedEntry {
    id: string
    title: string
}

export interface ActivityEntry extends CachedEntry {
    date: string
}

export interface GroupedActivities {
    [ date: string ]: {
        [ issueKey: string ]: string
    }
}

export const getActivities = async (jiraSettings: JiraSettings, maxResults: number, verbose: boolean, fromDate?: number): Promise<GroupedActivities> => {
    const fromDateFilter = fromDate ? `&streams=update-date+AFTER+${fromDate}` : ''
    const url = `activity?maxResults=${maxResults}&streams=user+IS+${encodeURIComponent(jiraSettings.username)}${fromDateFilter}&os_authType=basic`
    const response = await requestWithCredentials(jiraSettings, url, verbose).buffer(true)

    if (verbose) {
        console.log('\nStart converting the XML response to JS')
    }

    const body = await xml2js(response.text)

    if (verbose) {
        console.log('\nStart mapping the entries')
    }

    const activities = body.feed.entry.map((entry: any) => convertToActivityEntry(entry))

    const result: GroupedActivities = {}
    for (let activity of activities) {
        if (activity) {
            const parent = await getIssue(jiraSettings, activity, verbose)

            addToResult(result, parent, activity.date)
        }
    }

    return result
}

const getIssue = async (jiraSettings: JiraSettings, activity: ActivityEntry, verbose = false): Promise<CachedEntry> => {
    const issueFromCache = settingsStore.value(`issues.${activity.id}`)
    if (issueFromCache) {
        if (verbose) {
            console.log(`\nCache hit found for issue ${activity.id}`)
        }
        return issueFromCache
    }

    if (verbose) {
        console.log(`\nSearching the parent issue for ${activity.id} in jira`)
    }

    const parentIssueFromJira = await getParentIssueFromJira(jiraSettings, activity)
    if (parentIssueFromJira) {
        if (verbose) {
            console.log(`\nParent issue found for ${activity.id} > ${parentIssueFromJira.id}`)
        }

        settingsStore.setValue(`issues.${activity.id}`, parentIssueFromJira)
        return parentIssueFromJira
    }

    if (verbose) {
        console.log(`\nSaving the result into the cache for issue ${activity.id}`)
    }

    settingsStore.setValue(`issues.${activity.id}`, activity)
    return activity
}

const getParentIssueFromJira = async (jiraSettings: JiraSettings, activity: ActivityEntry): Promise<CachedEntry | undefined> => {
    const response = await requestWithCredentials(jiraSettings, `rest/api/2/issue/${activity.id}`).buffer(false)
    const parent = response.body.fields.parent

    if (parent) {
        return {
            id: parent.key,
            title: parent.fields.summary
        }
    }

    return undefined
}

const isValidActivityEntry = (activityEntry: any) => {
    return activityEntry && activityEntry.title && activityEntry.title[0] && activityEntry.summary && activityEntry.summary[0]
}

const convertToActivityEntry = (entry: any): ActivityEntry | undefined => {
    if (entry.published && entry.published[0]) {
        const activityEntry = entry['activity:object'][0]

        if (isValidActivityEntry(activityEntry)) {
            const title = activityEntry.title[0]['_']
            const summary = activityEntry.summary[0]['_']
            const published = entry.published[0].split('T')[0]

            return {
                id: title,
                title: summary,
                date: published
            }
        }
    }

    return undefined
}

const addToResult = async (result: GroupedActivities, entry: CachedEntry, date: string) => {
    if (!result.hasOwnProperty(date)) {
        result[date] = {}
    }

    if (!result[date].hasOwnProperty(entry.id)) {
        result[date][entry.id] = entry.title
    }
}

const requestWithCredentials = (jiraSettings: JiraSettings, path: string, verbose = false) => {
    if (verbose) {
        console.log(`\nGET https://${jiraSettings.hostname}/${path}`)
    }

    return request
        .get(`https://${jiraSettings.hostname}/${path}`)
        .auth(jiraSettings.username, jiraSettings.password)
}
