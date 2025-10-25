from django.db import models

# Create your models here.

# here are my location models (for the interactive map)


class Region(models.Model):
    name = models.CharField(max_length=100, unique=True)
    def __str__(self): return self.name

class City(models.Model):
    # If region is deleted, its cities are being deleted also
    region = models.ForeignKey(Region, on_delete=models.CASCADE, related_name="cities")
    name = models.CharField(max_length=100)
    # City-level markers for the map:
    latitude  = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)

    class Meta:
        # Force DB uniqueness
        unique_together = ("region", "name")
        # The idea is to search for this city only in the corresponding region, which speeds up the query
        indexes = [models.Index(fields=["region", "name"])]
        verbose_name_plural = "Cities"

    def __str__(self): return f"{self.name} ({self.region})"