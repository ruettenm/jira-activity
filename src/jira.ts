import * as request from 'superagent'
import * as xml2jsparser from 'superagent-xml2jsparser'
import * as settingsStore from "settings-store"

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

export const getActivities = async (jiraSettings: JiraSettings, maxResults: number, fromDate?: number): Promise<GroupedActivities> => {
    const fromDateFilter = fromDate ? `&streams=update-date+AFTER+${fromDate}` : ''
    const url = `activity?maxResults=${maxResults}&streams=user+IS+${encodeURIComponent(jiraSettings.username)}${fromDateFilter}&os_authType=basic`
    const response = await requestWithCredentials(jiraSettings, url).buffer(true).parse(xml2jsparser)

    const activities = response.body.feed.entry.map((entry: any) => convertToActivityEntry(entry))

    const result: GroupedActivities = {}
    for (let activity of activities) {
        if (activity) {
            const parent = await getParentIssue(jiraSettings, activity)

            addToResult(result, parent || activity, activity.date)
        }
    }

    return result
}
    
const getParentIssue = async (jiraSettings: JiraSettings, activity: ActivityEntry): Promise<CachedEntry | undefined> => {
    const parentIssue = settingsStore.value(`issues.${activity.id}`)
    if (parentIssue) {
        return parentIssue
    }

    const parentIssueFromJira = await getParentIssueFromJira(jiraSettings, activity)
    if (parentIssueFromJira) {
        settingsStore.setValue(`issues.${activity.id}`, parentIssueFromJira)
        return parentIssueFromJira
    }

    return undefined
}

const getParentIssueFromJira = async (jiraSettings: JiraSettings, activity: ActivityEntry): Promise<CachedEntry | undefined> => {
    const response = await requestWithCredentials(jiraSettings, `rest/api/2/issue/${activity.id}`)
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

const requestWithCredentials = (jiraSettings: JiraSettings, path: string) => {
    return request
        .get(`https://${jiraSettings.hostname}/${path}`)
        .auth(jiraSettings.username, jiraSettings.password)
}
