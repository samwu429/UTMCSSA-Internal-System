import { Route, Routes } from 'react-router'
import { AuthenticatedRouteGuard } from '@/app/routing/guards/AuthenticatedRouteGuard'
import { PortalMembershipGuard } from '@/app/routing/guards/PortalMembershipGuard'
import { PublicOnlyRouteGuard } from '@/app/routing/guards/PublicOnlyRouteGuard'
import { RootRedirect } from '@/app/routing/guards/RootRedirect'
import { portalSegments } from '@/app/routing/portalSegments'
import { routePaths } from '@/app/routing/routePaths'
import { AccountRestrictedPage } from '@/features/authentication/accountStatus/pages/AccountRestrictedPage'
import { AwaitingApprovalPage } from '@/features/authentication/accountStatus/pages/AwaitingApprovalPage'
import { SignInPage } from '@/features/authentication/login/pages/SignInPage'
import { ForgotPasswordPage } from '@/features/authentication/passwordReset/pages/ForgotPasswordPage'
import { ResetPasswordPage } from '@/features/authentication/passwordReset/pages/ResetPasswordPage'
import { RegistrationPage } from '@/features/authentication/registration/pages/RegistrationPage'
import { EmailVerificationPage } from '@/features/authentication/verification/pages/EmailVerificationPage'
import { AccountProfilePage } from '@/features/account/profile/pages/AccountProfilePage'
import { AdministrationConsolePage } from '@/features/administration/console/pages/AdministrationConsolePage'
import { ActivityCalendarPage } from '@/features/activities/calendar/pages/ActivityCalendarPage'
import { AnnouncementsPage } from '@/features/activities/announcements/pages/AnnouncementsPage'
import { CourseTimetablePage } from '@/features/academics/timetable/pages/CourseTimetablePage'
import { AlumniNetworkPage } from '@/features/directory/alumni/pages/AlumniNetworkPage'
import { MemberDirectoryPage } from '@/features/directory/members/pages/MemberDirectoryPage'
import { DocumentVaultPage } from '@/features/documents/vault/pages/DocumentVaultPage'
import { DepartmentOverviewPage } from '@/features/portals/overview/pages/DepartmentOverviewPage'
import { OversightPage } from '@/features/portals/oversight/pages/OversightPage'
import { PortalShell } from '@/features/portals/shell/layout/PortalShell'
import { BudgetLedgerPage } from '@/features/portals/specialized/finance/pages/BudgetLedgerPage'
import { ContentCalendarPage } from '@/features/portals/specialized/publicity/pages/ContentCalendarPage'
import { SponsorPipelinePage } from '@/features/portals/specialized/sponsorship/pages/SponsorPipelinePage'

export function ApplicationRouter() {
  return (
    <Routes>
      <Route path={routePaths.root} element={<RootRedirect />} />

      <Route element={<PublicOnlyRouteGuard />}>
        <Route path={routePaths.login} element={<SignInPage />} />
        <Route path={routePaths.register} element={<RegistrationPage />} />
        <Route path={routePaths.forgotPassword} element={<ForgotPasswordPage />} />
        <Route path={routePaths.resetPassword} element={<ResetPasswordPage />} />
      </Route>

      <Route path={routePaths.verifyEmail} element={<EmailVerificationPage />} />
      <Route path={routePaths.awaitingApproval} element={<AwaitingApprovalPage />} />
      <Route path={routePaths.accountRestricted} element={<AccountRestrictedPage />} />

      <Route element={<AuthenticatedRouteGuard />}>
        <Route element={<PortalMembershipGuard />}>
          <Route path="/portal/:departmentSlug" element={<PortalShell />}>
            <Route index element={<DepartmentOverviewPage />} />
            <Route path={portalSegments.announcements} element={<AnnouncementsPage />} />
            <Route path={portalSegments.members} element={<MemberDirectoryPage />} />
            <Route path={portalSegments.files} element={<DocumentVaultPage />} />
            <Route path={portalSegments.activities} element={<ActivityCalendarPage />} />
            <Route path={portalSegments.sponsors} element={<SponsorPipelinePage />} />
            <Route path={portalSegments.budget} element={<BudgetLedgerPage />} />
            <Route path={portalSegments.content} element={<ContentCalendarPage />} />
            <Route path={portalSegments.academic} element={<CourseTimetablePage />} />
            <Route path={portalSegments.network} element={<AlumniNetworkPage />} />
            <Route path={portalSegments.oversight} element={<OversightPage />} />
            <Route path={portalSegments.admin} element={<AdministrationConsolePage />} />
            <Route path={portalSegments.profile} element={<AccountProfilePage />} />
          </Route>
        </Route>
      </Route>
    </Routes>
  )
}
