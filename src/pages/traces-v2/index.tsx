import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import TraceV2 from './components/trace-v2/TraceV2'
import { TraceAnalytics } from './components/analytics'
import AnalyticsFiltersComponent from './components/analytics/AnalyticsFilters'
import useStore from '@/lib/store'
import { AnalyticsFilters } from './trace.service'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { useManageAdminStore } from '@/pages/manage-admin/manage-admin.store'
import { useAuth } from '@/contexts/AuthContext'
import { useOrganization } from '@/pages/organization/org.service'

const TraceView = () => {
    const [activeTab, setActiveTab] = useState('traces')
    const apiKey = useStore(state => state.api_key)
    const { current_organization } = useManageAdminStore()
    const { userId } = useCurrentUser()
    const { getToken } = useAuth()
    const [analyticsFilters, setAnalyticsFilters] = useState<AnalyticsFilters>({ days: 7 })
    const [orgMembers, setOrgMembers] = useState<any[]>([])

    // Roles that can view analytics across the organization
    const adminRoles = ["role_owner", "role_admin", "owner", "admin"]
    const isAdminRole = adminRoles.includes(current_organization?.role || "")

    // Fetch organization members
    const { getCurrentOrgMembers } = useOrganization({
        token: getToken()!,
        current_organization,
    })

    // Fetch members when org changes
    useEffect(() => {
        const fetchMembers = async () => {
            if (!current_organization?.org_id) return
            if (orgMembers.length > 0) return // Don't fetch if already loaded

            try {
                const res = await getCurrentOrgMembers()
                setOrgMembers(res.data || [])
            } catch (error) {
                console.error('Error fetching org members:', error)
            }
        }

        fetchMembers()
    }, [current_organization?.org_id])

    // Set default query_user_id filter to current user for everyone
    useEffect(() => {
        // Default to showing current user's analytics for all users
        if (userId) {
            setAnalyticsFilters((prev) => ({
                ...prev,
                query_user_id: userId,
            }))
        }
    }, [userId])

    const handleTabChange = (value: string) => {
        setActiveTab(value)
    }

    const handleApplyAnalyticsFilters = (newFilters: AnalyticsFilters) => {
        // Non-admin users must have their user_id in filters
        const filtersToApply = !isAdminRole && userId
            ? { ...newFilters, query_user_id: userId }
            : newFilters

        setAnalyticsFilters(filtersToApply)
    }

    const handleClearAnalyticsFilters = () => {
        // Default to current user when clearing filters
        const clearedFilters = userId
            ? { query_user_id: userId }
            : {}

        setAnalyticsFilters(clearedFilters)
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="h-full w-full space-y-4 p-6"
        >
            <div>
                <p className="text-xl font-bold">Monitoring</p>
                <p className="text-sm text-muted-foreground">
                    Real-time Monitoring of AI Agents
                </p>
            </div>
            <div>
                <Tabs value={activeTab} onValueChange={handleTabChange}>
                    <div className="flex items-center justify-between">
                        <TabsList>
                            <TabsTrigger value="analytics">Analytics</TabsTrigger>
                            <TabsTrigger value="traces">Traces</TabsTrigger>
                        </TabsList>
                        {activeTab === 'analytics' && (
                            <div className="flex gap-2">
                                <AnalyticsFiltersComponent
                                    filters={analyticsFilters}
                                    onApplyFilters={handleApplyAnalyticsFilters}
                                    onClearFilters={handleClearAnalyticsFilters}
                                    orgMembers={orgMembers}
                                />
                            </div>
                        )}
                    </div>
                    <TabsContent value='analytics' className="mt-6">
                        <TraceAnalytics apiKey={apiKey} filters={analyticsFilters} />
                    </TabsContent>
                    <TabsContent value="traces" className="mt-6">
                        <TraceV2 />
                    </TabsContent>

                </Tabs>
            </div>
        </motion.div>

    )
}

export default TraceView