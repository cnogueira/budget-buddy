export default function TermsPage() {
    return (
        <div className="bg-gray-50 dark:bg-black px-4 py-12 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl space-y-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-zinc-50">Terms of Service</h1>
                    <p className="mt-2 text-sm text-gray-500 dark:text-zinc-400">Last updated: April 2025</p>
                </div>

                <section className="space-y-3">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-zinc-50">Provided As-Is</h2>
                    <p className="text-gray-700 dark:text-zinc-300">
                        Budget Buddy is a personal finance tracking tool provided as-is, without warranty of any kind,
                        express or implied. We make no guarantees about accuracy, availability, or fitness for any
                        particular purpose.
                    </p>
                </section>

                <section className="space-y-3">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-zinc-50">Your Data</h2>
                    <p className="text-gray-700 dark:text-zinc-300">
                        You are solely responsible for the data you enter into the app. We do not verify the accuracy
                        of any financial information you provide, and we are not liable for any decisions made based
                        on data stored in Budget Buddy.
                    </p>
                </section>

                <section className="space-y-3">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-zinc-50">No Warranty or Liability</h2>
                    <p className="text-gray-700 dark:text-zinc-300">
                        To the fullest extent permitted by applicable law, we disclaim all warranties and shall not
                        be liable for any direct, indirect, incidental, or consequential damages arising from your
                        use of this service.
                    </p>
                </section>

                <section className="space-y-3">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-zinc-50">Termination</h2>
                    <p className="text-gray-700 dark:text-zinc-300">
                        We reserve the right to suspend or terminate your access to Budget Buddy at any time, for
                        any reason, without prior notice.
                    </p>
                </section>
            </div>
        </div>
    )
}
