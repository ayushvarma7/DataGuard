"use client";

import React from "react";
import { Shield, Github, Twitter, Linkedin, Mail, Heart } from "lucide-react";
import Link from "next/link";

export function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="bg-background border-t border-white/5 pt-20 pb-12 px-4">
            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-20">
                {/* Brand Column */}
                <div className="space-y-6">
                    <div className="flex items-center gap-2">
                        <Shield className="h-6 w-6 text-primary" />
                        <span className="text-xl font-bold tracking-tight">DataGuard</span>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                        The open-source data quality framework for the modern era.
                        Privacy-first, local-only, and extremely fast.
                    </p>
                    <div className="flex items-center gap-4">
                        <a href="https://github.com" className="text-muted-foreground hover:text-primary transition-colors">
                            <Github className="h-5 w-5" />
                        </a>
                        <a href="https://twitter.com" className="text-muted-foreground hover:text-primary transition-colors">
                            <Twitter className="h-5 w-5" />
                        </a>
                        <a href="https://linkedin.com" className="text-muted-foreground hover:text-primary transition-colors">
                            <Linkedin className="h-5 w-5" />
                        </a>
                    </div>
                </div>

                {/* Product Column */}
                <div className="space-y-6">
                    <h4 className="text-sm font-bold uppercase tracking-widest text-foreground">Product</h4>
                    <ul className="space-y-4 text-sm text-muted-foreground">
                        <li><Link href="/features" className="hover:text-primary transition-colors">Features</Link></li>
                        <li><Link href="/docs" className="hover:text-primary transition-colors">Documentation</Link></li>
                        <li><Link href="/app" className="hover:text-primary transition-colors">Launch Dashboard</Link></li>
                        <li><Link href="/pricing" className="hover:text-primary transition-colors">Self-Hosted</Link></li>
                    </ul>
                </div>

                {/* Community Column */}
                <div className="space-y-6">
                    <h4 className="text-sm font-bold uppercase tracking-widest text-foreground">Community</h4>
                    <ul className="space-y-4 text-sm text-muted-foreground">
                        <li><a href="https://github.com" className="hover:text-primary transition-colors">GitHub Discussions</a></li>
                        <li><a href="https://discord.com" className="hover:text-primary transition-colors">Discord Server</a></li>
                        <li><a href="/roadmap" className="hover:text-primary transition-colors">Roadmap</a></li>
                        <li><a href="/contribute" className="hover:text-primary transition-colors">Contributing</a></li>
                    </ul>
                </div>

                {/* Newsletter Column */}
                <div className="space-y-6">
                    <h4 className="text-sm font-bold uppercase tracking-widest text-foreground">Stay Updated</h4>
                    <p className="text-sm text-muted-foreground">
                        Get notified about new WASM patterns and schema templates.
                    </p>
                    <div className="flex gap-2">
                        <input
                            type="email"
                            placeholder="email@example.com"
                            className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm w-full focus:outline-none focus:border-primary transition-colors"
                        />
                        <button className="bg-primary text-primary-foreground p-2 rounded-lg hover:bg-primary/90 transition-colors">
                            <Mail className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto border-t border-white/5 pt-8 flex flex-col md:flex-row justify-between items-center gap-6">
                <p className="text-xs text-muted-foreground">
                    © {currentYear} DataGuard. All rights reserved.
                </p>
                <div className="flex items-center gap-6 text-xs text-muted-foreground">
                    <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link>
                    <Link href="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link>
                    <span className="flex items-center gap-1.5 grayscale opacity-50">
                        Made with <Heart className="h-3 w-3 text-red-500 fill-red-500" /> in London
                    </span>
                </div>
            </div>
        </footer>
    );
}
