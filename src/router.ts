import { createRouter } from 'sv-router';
import Main from './Main.svelte';
import Create from './create/Create.svelte';
import Decrypt from './decrypt/Decrypt.svelte';
import Hidden from './hidden/Hidden.svelte';

export const { p, navigate, isActive, route } = createRouter({
    '/': Main,
    '/create': Create,
    '/decrypt': Decrypt,
    '/hidden': Hidden,
});
