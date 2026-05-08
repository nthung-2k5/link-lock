<script>
	import { Router } from "sv-router";
	import "./router";
</script>

<Router base={import.meta.env.BASE_URL !== "/" ? import.meta.env.BASE_URL : undefined} />
