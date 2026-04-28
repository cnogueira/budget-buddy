export default function PrivacyPage() {
    return (
        <div className="min-h-screen bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl space-y-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900">Privacy Policy</h1>
                    <p className="mt-2 text-sm text-gray-500">Last updated: April 2025</p>
                </div>

                <section className="space-y-3">
                    <h2 className="text-xl font-semibold text-gray-900">Data We Collect</h2>
                    <p className="text-gray-700">
                        When you sign in with Google, we receive your name and email address from your Google profile.
                        If you sign up with email and password, we store only your email address.
                        Beyond authentication, Budget Buddy stores the financial transaction data and categories you enter.
                    </p>
                </section>

                <section className="space-y-3">
                    <h2 className="text-xl font-semibold text-gray-900">How We Use Your Data</h2>
                    <p className="text-gray-700">
                        Your name and email are used solely to authenticate you and identify your account.
                        Transaction data and categories are used to provide personal finance tracking features within the app.
                        We do not use your data for advertising, analytics, or any purpose beyond operating the service.
                    </p>
                </section>

                <section className="space-y-3">
                    <h2 className="text-xl font-semibold text-gray-900">Data Storage</h2>
                    <p className="text-gray-700">
                        All data is stored in a PostgreSQL database hosted by Supabase.
                        Row-level security (RLS) is enforced at the database level — your data is strictly isolated
                        and cannot be accessed by other users.
                    </p>
                </section>

                <section className="space-y-3">
                    <h2 className="text-xl font-semibold text-gray-900">Data Sharing</h2>
                    <p className="text-gray-700">
                        We do not sell, share, or disclose your data to any third parties.
                    </p>
                </section>

                <section className="space-y-3">
                    <h2 className="text-xl font-semibold text-gray-900">Contact</h2>
                    <p className="text-gray-700">
                        For data requests or questions about this policy, contact:{' '}
                        <a
                            href="mailto:cristofor.nogueira@gmail.com"
                            className="text-blue-600 hover:text-blue-500"
                        >
                            cristofor.nogueira@gmail.com
                        </a>
                    </p>
                </section>
            </div>
        </div>
    )
}
