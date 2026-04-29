export default function PrivacyPage() {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-black px-4 py-12 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl space-y-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-zinc-50">Privacy Policy</h1>
                    <p className="mt-2 text-sm text-gray-500 dark:text-zinc-400">Last updated: April 2025</p>
                </div>

                <section className="space-y-3">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-zinc-50">Data We Collect</h2>
                    <p className="text-gray-700 dark:text-zinc-300">
                        When you sign in with Google, we receive your name and email address from your Google profile.
                        If you sign up with email and password, we store only your email address.
                        Beyond authentication, Budget Buddy stores the financial transaction data and categories you enter.
                    </p>
                </section>

                <section className="space-y-3">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-zinc-50">How We Use Your Data</h2>
                    <p className="text-gray-700 dark:text-zinc-300">
                        Your name and email are used solely to authenticate you and identify your account.
                        Transaction data and categories are used to provide personal finance tracking features within the app.
                        We do not use your data for advertising, analytics, or any purpose beyond operating the service.
                    </p>
                </section>

                <section className="space-y-3">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-zinc-50">Data Storage</h2>
                    <p className="text-gray-700 dark:text-zinc-300">
                        All data is stored securely in the cloud.
                        Access controls ensure your data is strictly isolated and cannot be accessed by other users.
                    </p>
                </section>

                <section className="space-y-3">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-zinc-50">Data Sharing</h2>
                    <p className="text-gray-700 dark:text-zinc-300">
                        We do not sell, share, or disclose your data to any third parties.
                    </p>
                </section>

                <section className="space-y-3">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-zinc-50">Contact</h2>
                    <p className="text-gray-700 dark:text-zinc-300">
                        For data requests or questions about this policy, contact:{' '}
                        <a
                            href="mailto:cristofor.nogueira@gmail.com"
                            className="text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                            cristofor.nogueira@gmail.com
                        </a>
                    </p>
                </section>
            </div>
        </div>
    )
}
