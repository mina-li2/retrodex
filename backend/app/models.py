from sqlalchemy import Column, Integer, String, ForeignKey, Text
from sqlalchemy.orm import relationship
from .database import Base


class Pokemon(Base):
    __tablename__ = "pokemon"

    id = Column(Integer, primary_key=True)  # national dex number
    name = Column(String, nullable=False)
    species = Column(String)  # e.g. "Seed", "Lizard" (short genus, matches in-game Pokedex labels)
    generation = Column(Integer, nullable=False)
    height = Column(String)
    weight = Column(String)
    sprite_url = Column(String)
    flavor_text = Column(Text)

    types = relationship("PokemonType", back_populates="pokemon", cascade="all, delete-orphan")
    stats = relationship("PokemonStat", back_populates="pokemon", uselist=False, cascade="all, delete-orphan")
    abilities = relationship("PokemonAbility", back_populates="pokemon", cascade="all, delete-orphan")


class PokemonType(Base):
    __tablename__ = "pokemon_types"

    id = Column(Integer, primary_key=True, autoincrement=True)
    pokemon_id = Column(Integer, ForeignKey("pokemon.id"), nullable=False)
    type = Column(String, nullable=False)

    pokemon = relationship("Pokemon", back_populates="types")


class PokemonStat(Base):
    __tablename__ = "pokemon_stats"

    pokemon_id = Column(Integer, ForeignKey("pokemon.id"), primary_key=True)
    hp = Column(Integer)
    attack = Column(Integer)
    defense = Column(Integer)
    sp_attack = Column(Integer)
    sp_defense = Column(Integer)
    speed = Column(Integer)

    pokemon = relationship("Pokemon", back_populates="stats")


class PokemonAbility(Base):
    __tablename__ = "pokemon_abilities"

    id = Column(Integer, primary_key=True, autoincrement=True)
    pokemon_id = Column(Integer, ForeignKey("pokemon.id"), nullable=False)
    ability_name = Column(String, nullable=False)

    pokemon = relationship("Pokemon", back_populates="abilities")
